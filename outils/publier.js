#!/usr/bin/env node
/* PUBLICATION : la page publiée n'est plus la source telle quelle.
   Ce script copie le dépôt dans un dossier de publication (_site par défaut) et
   retire des trois pages ce qui ne sert qu'au lecteur du code : les
   commentaires JavaScript (par terser, SANS compression ni renommage — le code
   publié est le code écrit, blanc et commentaires en moins), les commentaires
   CSS (balayage qui respecte les chaînes) et les commentaires HTML. Rien
   d'autre ne change : mêmes identifiants, mêmes noms de fonctions, même ordre.
   La SOURCE, elle, ne bouge pas — le journal du code reste dans le dépôt.
   Mesuré en octobre 2026 (audit, T8) : la Seconde passait 1,2 s à analyser et
   compiler 5 Mo de JavaScript sur un téléphone, dont 1,2 Mo de commentaires.

   Usage : node outils/publier.js [dossier] [--verifier]
     --verifier : recharge chaque page publiée dans jsdom (tests/harnais.js) et
                  exige la même APP_VERSION et le même nombre d'exercices que
                  la source — la preuve que la transformation n'a rien cassé. */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { minify } = require('terser');
const RACINE = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const VERIFIER = args.includes('--verifier');
const CIBLE = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, '_site'));
const PAGES = ['secondes.html', 'premiere-specifique.html', 'terminale.html'];
const EXCLUS = new Set(['.git', 'node_modules', '_site', '.claude', '.github']);

function stripCSS(css){
  let out = '', i = 0, q = null;
  while(i < css.length){
    const c = css[i];
    if(q){ out += c; if(c === '\\'){ out += css[i + 1] || ''; i += 2; continue; } if(c === q) q = null; i++; continue; }
    if(c === '"' || c === "'"){ q = c; out += c; i++; continue; }
    if(c === '/' && css[i + 1] === '*'){ const j = css.indexOf('*/', i + 2); if(j < 0) throw new Error('commentaire CSS non fermé'); i = j + 2; continue; }
    out += c; i++;
  }
  return out;
}

async function transformer(html, nom){
  let nScripts = 0, nStyles = 0;
  const blocs = [];
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (tout, attrs, code) => {
    if(/\bsrc\s*=/.test(attrs) || !code.trim()) return tout;
    blocs.push({ attrs, code, cle: '\u0000SCRIPT' + blocs.length + '\u0000' });
    return blocs[blocs.length - 1].cle;
  });
  for(const b of blocs){
    const module = /type\s*=\s*["']module["']/.test(b.attrs);
    const r = await minify(b.code, { compress: false, mangle: false, module, format: { comments: false, inline_script: true } });
    if(!r.code) throw new Error(nom + ' : terser n’a rien rendu pour un bloc <script' + b.attrs + '>');
    b.sortie = r.code; nScripts++;
  }
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/g, (tout, attrs, css) => { nStyles++; return '<style' + attrs + '>' + stripCSS(css) + '</style>'; });
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/\n{3,}/g, '\n\n');
  for(const b of blocs) html = html.replace(b.cle, () => '<script' + b.attrs + '>' + b.sortie + '</script>');
  if(!/^<!DOCTYPE html>/i.test(html)) throw new Error(nom + ' : le DOCTYPE n’est plus en tête');
  const charset = html.indexOf('<meta charset');
  if(charset < 0 || charset > 1024) throw new Error(nom + ' : <meta charset> hors des 1 024 premiers octets (' + charset + ')');
  return { html, nScripts, nStyles };
}

function copier(src, dst){
  fs.mkdirSync(dst, { recursive: true });
  for(const e of fs.readdirSync(src, { withFileTypes: true })){
    if(EXCLUS.has(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if(e.isSymbolicLink()) continue;
    if(e.isDirectory()) copier(s, d); else fs.copyFileSync(s, d);
  }
}

function sonder(cwd, page){
  const code = "const H=require('./tests/harnais.js');H.charger(" + JSON.stringify(page) + ",w=>{const r={v:w.eval('APP_VERSION'),n:w.eval('Object.keys(TESTS).length'),show:w.eval('typeof show'),themes:w.eval('typeof THEMES')};console.log('@@'+JSON.stringify(r));process.exit(0)},1500)";
  const sortie = execFileSync(process.execPath, ['-e', code], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 });
  const m = sortie.split('\n').find(l => l.startsWith('@@'));
  if(!m) throw new Error('sonde sans réponse pour ' + page + ' dans ' + cwd);
  return JSON.parse(m.slice(2));
}

(async () => {
  if(fs.existsSync(CIBLE)) fs.rmSync(CIBLE, { recursive: true, force: true });
  copier(RACINE, CIBLE);
  const bilan = [];
  for(const p of PAGES){
    const src = fs.readFileSync(path.join(RACINE, p), 'utf8');
    const { html, nScripts, nStyles } = await transformer(src, p);
    fs.writeFileSync(path.join(CIBLE, p), html);
    /* la page construite n'a plus de retours à la ligne dans ses scripts : pas d'ancre de début de ligne */
    const vs = (src.match(/\bconst APP_VERSION=(\d+);/) || [])[1], vp = (html.match(/\bconst APP_VERSION=(\d+);/) || [])[1];
    if(!vs || vs !== vp) throw new Error(p + ' : APP_VERSION ' + vs + ' → ' + vp);
    bilan.push({ page: p, avant: src.length, apres: html.length, nScripts, nStyles, version: vs });
  }
  for(const b of bilan) console.log(`${b.page.padEnd(26)} v${b.version}  ${(b.avant / 1e6).toFixed(2)} Mo → ${(b.apres / 1e6).toFixed(2)} Mo  (${b.nScripts} scripts, ${b.nStyles} feuilles)`);
  if(VERIFIER){
    const lien = path.join(CIBLE, 'node_modules');
    fs.symlinkSync(path.join(RACINE, 'node_modules'), lien, 'dir');
    try {
      for(const p of PAGES){
        const a = sonder(RACINE, p), b = sonder(CIBLE, p);
        if(JSON.stringify(a) !== JSON.stringify(b)) throw new Error(p + ' : la page publiée ne se comporte pas comme la source — source ' + JSON.stringify(a) + ', publiée ' + JSON.stringify(b));
        console.log(`✓ ${p} publiée : APP_VERSION ${b.v}, ${b.n} exercices, show() et THEMES présents — comme la source`);
      }
    } finally { fs.unlinkSync(lien); }
  }
  console.log('Publication prête dans ' + CIBLE);
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
