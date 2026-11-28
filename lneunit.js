function saClean(s){
  s=String(s==null?'':s);
  s=s.replace(/\\placeholder\{\}/g,'');
  var prev;
  do{ prev=s;
    s=s.replace(/(\\times|\\cdot|\\div|\\,|\\;|\\:|\\ |~)$/,'');
    s=s.replace(/\s+$/,'');
    s=s.replace(/\{\s*\}$/,'');
    s=s.replace(/[\^_]$/,'');
    s=s.replace(/[+\/*−-]$/,'');
  }while(s!==prev);
  return s.trim();
}
function lndLire(lx, lettres){   /* lettres : les variables lues (« abe » par défaut ; le 9.3.1 lit « xe ») */
  const LET=(lettres==null?'abe':lettres);
  let s=saClean(String(lx==null?'':lx));
  s=s.replace(/\\left|\\right/g,'')
     .replace(/\\mathrm\{e\}|\\exponentialE|\\operatorname\{e\}/g,'e')
     .replace(/\\operatorname\{ln\}|\\mathrm\{ln\}/g,'\\ln ')
     .replace(/\{,\}/g,'.').replace(/,/g,'.')
     .replace(/\\[dt]frac/g,'\\frac').replace(/\\times|\\cdot/g,'*').replace(/\\div/g,'/')
     .replace(/\\[,;:! ]|~/g,' ').replace(/−/g,'-').replace(/½/g,'{(1/2)}')
     .replace(/\\placeholder\{[^{}]*\}/g,'').replace(/\\lbrack/g,'[').replace(/\\rbrack/g,']');
  /* UN EXPOSANT VIDE QUI PORTE UN EXPOSANT : « ^ » tapé deux fois écrit
     3^{^4} (ou 3^{{}^4}) — à l'écran, un 3 et un 4 minuscule en haut, que
     l'élève lit 3⁴. Le juge le lit comme il s'affiche : 3^{4} (novembre 2026,
     « ln(3⁴) + ln(3³) − 5 ln 3 » comptée fausse). */
  let s0; do{ s0=s; s=s.replace(/\^\{\s*(?:\{\s*\}\s*)?\^/g,'^{'); }while(s!==s0);
  const T=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){ i++; continue; }
    if(c==='\\'){ const m=/^\\([a-zA-Z]+)/.exec(s.slice(i)); if(!m) return null; T.push({t:'cmd',v:m[1]}); i+=m[0].length; continue; }
    if(/[0-9.]/.test(c)){ const m=/^(?:\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if(!m||m[0]==='.') return null; T.push({t:'n',raw:m[0]}); i+=m[0].length; continue; }
    if(/[a-z]/.test(c) && LET.indexOf(c)>=0){ T.push({t:'v',v:c}); i++; continue; }
    if('+-*/^(){}[]'.indexOf(c)>=0){ T.push({t:c}); i++; continue; }
    return null;
  }
  let k=0;
  const voir=()=>T[k]?T[k].t:null;
  const prendre=t=>{ if(voir()!==t) throw 0; return T[k++]; };
  const debutAtome=()=>{ const t=voir(); return t==='n'||t==='v'||t==='('||t==='{'||(t==='cmd'&&/^(frac|sqrt|ln)$/.test(T[k].v)); };
  function expr(){ let f=terme(); while(voir()==='+'||voir()==='-'){ const op=T[k++].t; f={t:op,a:f,b:terme()}; } return f; }
  function terme(){ let f=unaire();
    for(;;){ if(voir()==='*'||voir()==='/'){ const op=T[k++].t; f={t:op,a:f,b:unaire()}; }
      else if(debutAtome()){ f={t:'*',a:f,b:puissance()}; } else break; }
    return f; }
  function unaire(){ if(voir()==='-'){ k++; return {t:'neg',a:unaire()}; } if(voir()==='+'){ k++; return unaire(); } return puissance(); }
  function puissance(){ const b=atome(); if(voir()==='^'){ k++; return {t:'^',a:b,b:argument()}; } return b; }
  /* l'argument d'un ^, d'un \frac, d'un \sqrt : un groupe {…}, ou UN SEUL
     caractère — « \frac12 » est 1/2, « e^23 » est e²·3 en LaTeX */
  function argument(){
    const t=voir();
    if(t==='{'){ k++; const g=expr(); prendre('}'); return g; }
    if(t==='n'){ const tok=T[k]; if(tok.raw.length>1){ const v=tok.raw[0]; tok.raw=tok.raw.slice(1); return {t:'n',v:+v}; } k++; return {t:'n',v:+tok.raw}; }
    if(t==='-'){ k++; return {t:'neg',a:argument()}; }
    return atome();
  }
  function atome(){
    const t=voir();
    if(t==='n'){ return {t:'n',v:parseFloat(T[k++].raw)}; }
    if(t==='v'){ return {t:'v',n:T[k++].v}; }
    if(t==='('){ k++; const g=expr(); prendre(')'); return g; }
    if(t==='['){ k++; const g=expr(); prendre(']'); return g; }
    if(t==='{'){ k++; const g=expr(); prendre('}'); return g; }
    if(t==='cmd'){ const c=T[k++].v;
      if(c==='frac'){ const n=argument(), d=argument(); return {t:'/',a:n,b:d}; }
      if(c==='sqrt'){ let ix=null; if(voir()==='['){ k++; ix=expr(); prendre(']'); } return {t:'rac',a:argument(),k:ix}; }
      if(c==='ln'){ if(voir()==='(') return {t:'ln',a:atome()}; return {t:'ln',a:puissance()}; }
    }
    throw 0;
  }
  try{ if(!T.length) return null; const f=expr(); return k===T.length?f:null; }catch(e){ return null; }
}
function lndEval(n, env){
  switch(n.t){
    case 'n': return n.v;
    case 'v': return n.n==='e'?Math.E:env[n.n];
    case '+': return lndEval(n.a,env)+lndEval(n.b,env);
    case '-': return lndEval(n.a,env)-lndEval(n.b,env);
    case '*': return lndEval(n.a,env)*lndEval(n.b,env);
    case '/': return lndEval(n.a,env)/lndEval(n.b,env);
    case '^': return Math.pow(lndEval(n.a,env),lndEval(n.b,env));
    case 'neg': return -lndEval(n.a,env);
    case 'ln': { const u=lndEval(n.a,env); return u>0?Math.log(u):NaN; }
    case 'rac': { const u=lndEval(n.a,env), ix=n.k?lndEval(n.k,env):2; return u>=0?Math.pow(u,1/ix):NaN; }
  }
  return NaN;
}
/* les couples (a, b) où la famille à lettres se calcule — a, b > 0 */
function lndNombre(raw){
  const t=String(raw==null?'':raw).trim().replace(/½/g,'1/2');
  if(t==='' || /[a-zA-Z]/.test(t)) return null;
  const f=compileExprExp(t); if(!f) return null;
  let v; try{ v=f(0); }catch(e){ return null; }
  return (typeof v==='number' && isFinite(v)) ? v : null;
}
/* les cases des étapes : chacune contre sa valeur ; une PAIRE (grp) se juge
   dans l'ordre que l'on veut — l'ordre qui donne le plus de cases justes */
/* ====================== TEST : Résoudre une équation avec ln (kind 'lne') ====================== */
/* Demande de Turquet (novembre 2026), avec la fiche « Résoudre ln(−x + 2) +
   ln(x) = 0 sur ]0 ; 2[ ⟺ ln[(…)×(…)] = 0 ⟺ (…)×(…) = … ⟺ … = … ⟺ … = 0
   ⟺ x = … avec Δ = … » et sa « Question 2 : ln x + ln(x − 10) = ln 3 + ln 7 » :
   « créer un exercice dans ln comme le pdf ; les solutions seront entières et
   relatives ; on fera comme dans le 9.2.1, un mode avec étapes ou sans étape ;
   dans les étapes on écrira si on attend un développement ; pour le mode sans
   étape on acceptera toutes les équations équivalentes, et on pourra sauter
   des étapes ».
   LA FORME : ln(a₁x + b₁) + ln(a₂x + b₂) = 0, = ln K ou = ln p + ln s, sur
   l'intervalle I où les deux logarithmes existent (donné par l'énoncé, comme
   sur la fiche). a₁, a₂ = ±1 : le produit est un trinôme de coefficient ±1,
   ses racines sont entières dès que Δ est un carré de la bonne parité. Le
   tirage énumère toutes les équations dont AU MOINS une racine est dans I,
   aucune racine au-delà de 12 en valeur absolue.
   QUATRE FAMILLES, une question chacune :
     zero  = 0, I borné : Δ = 0, une racine double (la fiche, ]0 ; 2[)
     som   = ln p + ln s, I non borné : une racine dans I, l'autre écartée
           (la Question 2)
     int   = ln K, I borné, Δ > 0 : une ou deux solutions dans I
     mix   = ln K ou ln p + ln s, l'une ou l'autre sorte d'intervalle
   DEUX FAÇONS, au choix de l'élève (test.lneMode, le geste du 9.2.1) :
   · « Avec les étapes » — la chaîne de la fiche, chaque ligne nommant ce
     qu'elle attend (« ← développe le membre de gauche », « ← tout dans le
     membre de gauche, puis réduis ») ;
   · « Sans étape » — la feuille commune (mlFeuille), chaque ligne préfixée de
     « ⟺ » : chaque ligne doit être une équation ÉQUIVALENTE sur I — même
     ensemble de solutions dans I —, l'élève saute les étapes qu'il veut ; la
     dernière donne les solutions (« x = 3 », « x = 1 ou x = 4 », « S = {3} »).
     Une ligne « Δ = … » ou « x₁ = … » est un calcul annexe, jugé sur sa
     valeur.
   LE JUGE NE CROIT AUCUNE ÉCRITURE : lndLire (celui du 9.2.1, ouvert à la
   lettre x) lit chaque membre, lndEval le calcule. Une équation est jugée sur
   I : vraie en chaque solution, fausse en une grille de points de I écartés
   des solutions. La question ne porte que ses paramètres, lneAns recalcule
   tout. */
const LNE_FAM=['zero','som','int','mix'];
const LNE_PAIRES=(function(){ const P=[]; [2,3,5,7].forEach(p=>[3,4,5,6,7,8,9,10,11,13].forEach(s=>{ if(s>p && p*s<=40) P.push([p,s]); })); return P; })();
/* toutes les équations d'une famille, déjà rangées dans la forme de la question */
function lneCandidats(fam){
  const out=[];
  const Ks=fam==='zero'?[1]:(fam==='som'?[...new Set(LNE_PAIRES.map(x=>x[0]*x[1]))]:Array.from({length:23},(_,i)=>i+2));
  for(const a1 of [1,-1]) for(const a2 of [1,-1]) for(let b1=-6;b1<=6;b1++) for(let b2=-6;b2<=6;b2++){
    if(a1===a2 && b1>=b2) continue;            /* u ≠ v, et une seule écriture de chaque paire */
    if(a1!==a2 && a1<0) continue;
    if(b1===0 && b2===0) continue;
    const I=lneIntervalle(a1,b1,a2,b2); if(!I) continue;
    const borne=isFinite(I.lo)&&isFinite(I.hi);
    if(fam==='som' && borne) continue;
    if((fam==='zero'||fam==='int') && !borne) continue;
    for(const K of Ks){
      const R=lneRacines(a1*a2, a1*b2+a2*b1, b1*b2-K); if(!R) continue;
      if(Math.abs(R[0])>12 || Math.abs(R[1])>12) continue;
      if(fam!=='zero' && R[0]===R[1]) continue;
      if(!R.some(r=>r>I.lo && r<I.hi)) continue;
      out.push({a1:a1,b1:b1,a2:a2,b2:b2,K:K});
    }
  }
  return out;
}
function lneIntervalle(a1,b1,a2,b2){
  let lo=-Infinity, hi=Infinity;
  [[a1,b1],[a2,b2]].forEach(function(c){ if(c[0]>0) lo=Math.max(lo,-c[1]/c[0]); else hi=Math.min(hi,c[1]/(-c[0])); });
  return lo<hi?{lo:lo,hi:hi}:null;
}
/* les racines entières d'un trinôme de coefficient ±1, dans l'ordre ; null sinon */
function lneRacines(A,B,C){
  const D=B*B-4*A*C; if(D<0) return null;
  const s=Math.round(Math.sqrt(D)); if(s*s!==D) return null;
  if((-B+s)%(2*A)!==0) return null;
  const r=[(-B-s)/(2*A),(-B+s)/(2*A)].sort((x,y)=>x-y);
  return r.map(x=>x===0?0:x);
}
function lneGenFam(fam){
  const C=lneCandidats(fam);
  const c=Object.assign({}, pick(C));
  if(Math.random()<0.5){ const t=[c.a1,c.b1]; c.a1=c.a2; c.b1=c.b2; c.a2=t[0]; c.b2=t[1]; }   /* l'ordre des deux ln, au hasard */
  const q={t:fam, a1:c.a1, b1:c.b1, a2:c.a2, b2:c.b2, K:c.K, rhs:fam==='zero'?'zero':(fam==='som'?'somme':'un')};
  if(fam==='mix'){ const P=LNE_PAIRES.filter(x=>x[0]*x[1]===c.K); if(P.length && Math.random()<0.5) q.rhs='somme'; }
  if(q.rhs==='somme'){ const P=pick(LNE_PAIRES.filter(x=>x[0]*x[1]===c.K)); q.p=P[0]; q.s=P[1]; }
  return q;
}
function lneGen(){
  return distinctes(LNE_FAM.length, function(u,i){
    return lneGenFam(LNE_FAM[i]);
  });
}

/* ---- écrire ---- */
function lneAffTex(a,b){ const ax=a===1?'x':'-x'; return b===0?ax:ax+(b>0?'+':'-')+Math.abs(b); }
function lneAffHtml(a,b){ const ax=(a===1?'':'−')+'<i>x</i>'; return b===0?ax:ax+(b>0?' + ':' − ')+Math.abs(b); }
function lneAffPlain(a,b){ const ax=(a===1?'':'−')+'x'; return b===0?ax:ax+(b>0?' + ':' − ')+Math.abs(b); }
/* un trinôme A x² + B x + C — A = ±1 */
function lnePolyTex(A,B,C){
  let t=(A===1?'':(A===-1?'-':String(A)))+'x^2';
  if(B!==0) t+=(B>0?'+':'-')+(Math.abs(B)===1?'':Math.abs(B))+'x';
  if(C!==0) t+=(C>0?'+':'-')+Math.abs(C);
  return t;
}
function lnePolyHtml(A,B,C){
  let t=(A===1?'':(A===-1?'−':numFmt(A)))+'<i>x</i>²';
  if(B!==0) t+=(B>0?' + ':' − ')+(Math.abs(B)===1?'':Math.abs(B))+'<i>x</i>';
  if(C!==0) t+=(C>0?' + ':' − ')+Math.abs(C);
  return t;
}
function lnePolyPlain(A,B,C){ return lnePolyHtml(A,B,C).replace(/<[^>]*>/g,''); }
function lneBorne(v){ return v===Infinity?'+∞':(v===-Infinity?'−∞':numFmt(v)); }
/* Tout ce que la question montre, se calcule et se corrige — depuis ses
   seuls paramètres. */
function lneAns(q){
  const A={q:q};
  A.u={a:q.a1,b:q.b1}; A.v={a:q.a2,b:q.b2};
  A.fu=x=>q.a1*x+q.b1; A.fv=x=>q.a2*x+q.b2;
  A.P={A:q.a1*q.a2, B:q.a1*q.b2+q.a2*q.b1, C:q.b1*q.b2};     /* u × v développé */
  A.K=q.K;
  A.delta=A.P.B*A.P.B-4*A.P.A*(A.P.C-A.K);
  A.racines=lneRacines(A.P.A, A.P.B, A.P.C-A.K);
  A.double=A.racines[0]===A.racines[1];
  const I=lneIntervalle(q.a1,q.b1,q.a2,q.b2); A.I=I;
  A.S=[...new Set(A.racines)].filter(r=>r>I.lo && r<I.hi);
  A.Ihtml=']'+lneBorne(I.lo)+' ; '+lneBorne(I.hi)+'[';
  const uT=lneAffTex(q.a1,q.b1), vT=lneAffTex(q.a2,q.b2), uH=lneAffHtml(q.a1,q.b1), vH=lneAffHtml(q.a2,q.b2);
  A.uTex=uT; A.vTex=vT; A.uHtml=uH; A.vHtml=vH; A.uPlain=lneAffPlain(q.a1,q.b1); A.vPlain=lneAffPlain(q.a2,q.b2);
  const rhsT=q.rhs==='zero'?'0':(q.rhs==='somme'?'\\ln '+q.p+'+\\ln '+q.s:'\\ln '+q.K);
  const rhsH=q.rhs==='zero'?'0':(q.rhs==='somme'?'ln '+q.p+' + ln '+q.s:'ln '+q.K);
  A.eqTex='\\ln\\left('+uT+'\\right)+\\ln\\left('+vT+'\\right)='+rhsT;
  A.eqHtml='ln('+uH+') + ln('+vH+') = '+rhsH;
  A.eqPlain='ln('+A.uPlain+') + ln('+A.vPlain+') = '+rhsH;
  A.Splain=A.S.map(numFmt).join(' ; ');
  A.Stex=A.S.map(String).join(';');
  A.conclusion=A.S.length===1?'x = '+numFmt(A.S[0]):A.S.map(r=>'x = '+numFmt(r)).join(' ou ');
  /* la grille où une équation fausse se montre : des points de I, écartés des solutions */
  const G=[];
  if(isFinite(I.lo)&&isFinite(I.hi)){ for(let j=0;j<41;j++) G.push(I.lo+(I.hi-I.lo)*(j+0.37)/41); }
  else if(isFinite(I.lo)){ for(let j=0;j<44;j++) G.push(I.lo+0.13+j*0.61); G.push(I.lo+53.7, I.lo+211.3); }
  else { for(let j=0;j<44;j++) G.push(I.hi-0.13-j*0.61); G.push(I.hi-53.7, I.hi-211.3); }
  A.grille=G.filter(x=>A.racines.every(r=>Math.abs(x-r)>0.03));
  return A;
}
/* le rappel des propriétés, dit au-dessus des étapes */
function lneAstuce(q){
  const a='<i>a</i>', b='<i>b</i>';
  return 'ln '+a+' + ln '+b+' = ln('+a+' × '+b+'), '+(q.rhs==='zero'?'ln '+a+' = 0 ⟺ '+a+' = 1':'ln '+a+' = ln '+b+' ⟺ '+a+' = '+b)
    +', puis le discriminant Δ = '+b+'² − 4'+a+'<i>c</i>.';
}

/* ---- lire et juger ---- */
function lneVal(id){
  const el=$(id); if(!el) return '';
  try{ return saClean(String(el.tagName==='MATH-FIELD'?el.getValue():(el.value==null?'':el.value))).trim(); }catch(e){ return ''; }
}
function lneLireX(lx){ return lndLire(lx,'xe'); }
const LNE_X=[-3.7,-1.3,0.6,2.2,4.9];
/* un membre qui vaut la fonction f en tout x */
function lneVautFn(lx, f){
  const n=lneLireX(lx); if(!n) return false;
  return LNE_X.every(function(x){ const v=lndEval(n,{x:x}), t=f(x); return isFinite(v) && Math.abs(v-t)<=1e-9*(1+Math.abs(t)); });
}
/* une somme de monômes c·xⁿ — null dès qu'une parenthèse porte une somme */
function lneMonomes(n){
  const out=[];
  function mono(m){
    if(m.t==='n') return {d:0,c:m.v};
    if(m.t==='v') return m.n==='x'?{d:1,c:1}:null;
    if(m.t==='neg'){ const r=mono(m.a); return r?{d:r.d,c:-r.c}:null; }
    if(m.t==='^'){ if(m.b.t!=='n' || !Number.isInteger(m.b.v)) return null; const r=mono(m.a); if(!r) return null;
      if(r.d===0) return {d:0,c:Math.pow(r.c,m.b.v)}; if(r.c!==1) return null; return {d:r.d*m.b.v,c:1}; }
    if(m.t==='*'){ const x=mono(m.a), y=mono(m.b); return (x&&y)?{d:x.d+y.d,c:x.c*y.c}:null; }
    if(m.t==='/'){ const x=mono(m.a), y=mono(m.b); return (x&&y&&y.d===0&&y.c!==0)?{d:x.d,c:x.c/y.c}:null; }
    return null;
  }
  function somme(m,sg){
    if(m.t==='+'){ return somme(m.a,sg) && somme(m.b,sg); }
    if(m.t==='-'){ return somme(m.a,sg) && somme(m.b,-sg); }
    if(m.t==='neg' && (m.a.t==='+'||m.a.t==='-')) return false;   /* −(x + 1) n'est pas développé */
    const r=mono(m); if(!r) return false; out.push({d:r.d,c:sg*r.c}); return true;
  }
  return somme(n,1)?out:null;
}
function lneDeveloppe(lx){ const n=lneLireX(lx); return !!(n && lneMonomes(n)); }
function lneReduit(lx){
  const n=lneLireX(lx); if(!n) return false; const M=lneMonomes(n); if(!M) return false;
  const d=M.map(m=>m.d); return d.length===new Set(d).size;
}
/* une case de nombre */
function lneNombre(raw){ return lndNombre(raw); }
/* Δ juste : celui du trinôme réduit, à un facteur près (l'élève qui a
   multiplié par −1 ou par 2 a le Δ de SON trinôme, λ²Δ) */
function lneDeltaOk(A, v, lambda){
  if(typeof v!=='number' || !isFinite(v)) return false;
  if(A.double) return Math.abs(v)<1e-9;
  if(Math.abs(v-A.delta)<1e-9) return true;
  if(lambda && Math.abs(v-lambda*lambda*A.delta)<1e-9) return true;
  return false;
}
/* une liste de solutions « 1 ; 4 », « {1;4} », « 1, 4 » */
function lneListe(lx){
  let s=String(lx==null?'':lx).replace(/\\left|\\right/g,'').replace(/\\lbrace|\\rbrace|\\\{|\\\}/g,' ')
    .replace(/\{,\}/g,';').replace(/,/g,';').replace(/−/g,'-');
  /* les accolades de groupe de MathLive restent : on les retire autour d'un nombre */
  s=s.replace(/[{}]/g,' ');
  const parts=s.split(';').map(t=>t.trim()).filter(Boolean);
  if(!parts.length) return null;
  const v=parts.map(function(t){ const n=lndLire(t,''); if(!n) return NaN; return lndEval(n,{}); });
  return v.every(x=>typeof x==='number'&&isFinite(x))?v:null;
}
function lneMemeEnsemble(L, S){
  if(!L) return false;
  const u=[...new Set(L.map(x=>Math.round(x*1e9)/1e9))];
  return u.length===S.length && S.every(r=>u.some(x=>Math.abs(x-r)<1e-9));
}

/* ---- la feuille « Sans étape » : chaque ligne, une équation équivalente sur I ---- */
function lnePrep(lx){
  return String(lx==null?'':lx)
    .replace(/\\text\{([^{}]*)\}|\\mathrm\{([^{}]*)\}|\\operatorname\{([^{}]*)\}|\\textrm\{([^{}]*)\}/g,function(m,a,b,c,d){ const w=(a||b||c||d||''); return /^\s*(ln)\s*$/.test(w)?'\\ln ':' '+w+' '; })
    .replace(/\\lor|\\vee/g,' ou ');
}
function lneNumMembre(t){
  const n=lndLire(t,'xe'); if(!n) return NaN;
  const v=lndEval(n,{x:NaN}); return (typeof v==='number'&&isFinite(v))?v:NaN;
}
function lneJugerUne(A, s){
  const M=s.split('=').map(t=>t.trim());
  if(M.length<2 || M.some(t=>t==='')) return {ok:false, fini:false};
  const g=M[0];
  /* Δ = b² − 4ac = … : un calcul annexe ; un membre en a, b, c est la formule */
  if(/^\\Delta$/.test(g)){
    const V=M.slice(1).filter(t=>!(/[abc]/.test(t.replace(/\\[a-zA-Z]+/g,'')) && !/x/.test(t))).map(lneNumMembre);
    if(!V.length || V.some(v=>isNaN(v)) || V.some(v=>Math.abs(v-V[0])>1e-9)) return {ok:false, fini:false};
    let ok=lneDeltaOk(A, V[0]);
    if(!ok && !A.double && V[0]>0){ const l=Math.sqrt(V[0]/A.delta); if(Math.round(l)>=1 && Math.abs(l-Math.round(l))<1e-7) ok=true; }   /* le Δ d'un trinôme multiplié par un entier λ : λ²Δ */
    return {ok:ok, fini:false};
  }
  /* x₁ = … : une racine du trinôme, même hors de I */
  if(/^x_\{?[0-9]\}?$/.test(g)){
    const V=M.slice(1).map(lneNumMembre);
    if(V.some(v=>isNaN(v)) || V.some(v=>Math.abs(v-V[0])>1e-9)) return {ok:false, fini:false};
    return {ok:A.racines.some(r=>Math.abs(r-V[0])<1e-9), fini:false};
  }
  /* S = {…} */
  if(/^(S|\\mathcal\{S\}|\\mathscr\{S\})$/.test(g)){
    if(M.length!==2) return {ok:false, fini:false};
    const ok=lneMemeEnsemble(lneListe(M[1]), A.S); return {ok:ok, fini:ok};
  }
  /* une équation, ou plusieurs reliées par « ou » */
  const eqs=s.split(/\s*ou\s*/).map(t=>t.trim()).filter(Boolean).map(function(e){
    const m=e.split('=').map(t=>t.trim()); if(m.length<2||m.some(t=>t==='')) return null;
    const a=m.map(lneLireX); return a.every(Boolean)?a:null;
  });
  if(!eqs.length || eqs.some(e=>!e)) return {ok:false, fini:false};
  const vraie=function(x){
    return eqs.some(function(ms){
      const v=ms.map(n=>lndEval(n,{x:x}));
      if(v.some(y=>typeof y!=='number'||!isFinite(y))) return false;
      return v.every(y=>Math.abs(y-v[0])<=1e-8*(1+Math.abs(v[0])));
    });
  };
  const ok=A.S.every(vraie) && A.grille.every(x=>!vraie(x));
  /* finie : « x = n » (ou « n = x »), autant que de solutions, ni plus ni moins */
  let fini=false;
  if(ok){
    const vals=eqs.map(function(ms){
      if(ms.length!==2) return NaN;
      const [p,q]=ms, estX=n=>n.t==='v'&&n.n==='x';
      const nb=n=>{ const v=lndEval(n,{x:NaN}); return (typeof v==='number'&&isFinite(v))?v:NaN; };
      if(estX(p)) return nb(q); if(estX(q)) return nb(p); return NaN;
    });
    fini=vals.every(v=>!isNaN(v)) && lneMemeEnsemble(vals, A.S) && vals.length===A.S.length;
  }
  return {ok:ok, fini:fini};
}
function lneJugerLigne(A, lx){
  const s=saClean(lnePrep(lx)).trim();
  if(!s) return {vide:true, ok:false, fini:false};
  /* « ⟺ » écrit dans la ligne : chaque morceau est une équation */
  const parts=s.split(/\\(?:Longleftrightarrow|Leftrightarrow|iff)/).map(t=>t.trim()).filter(Boolean);
  const J=parts.map(p=>lneJugerUne(A,p));
  return {vide:false, ok:J.every(j=>j.ok), fini:J.every(j=>j.ok) && J[J.length-1].fini};
}
let lneFeuille=null;
function lneLignesFeuille(){
  if(!lneFeuille) return [];
  return lneFeuille.lignes.map(function(L){ let lx=''; try{ lx=String(L.mf.getValue?L.mf.getValue():''); }catch(e){} return {L:L, lx:lx}; })
    .filter(x=>saClean(x.lx).trim()!=='');
}
function lneVerdictFeuille(A){
  const lg=lneLignesFeuille();
  lg.forEach(x=>{ const j=lneJugerLigne(A, x.lx); x.ok=j.ok; x.fini=j.fini; });
  const der=lg[lg.length-1];
  return {lignes:lg, vide:lg.length===0, justes:lg.length>0 && lg.every(x=>x.ok), arrive:!!(der && der.fini),
          ok:lg.length>0 && lg.every(x=>x.ok) && !!(der && der.fini)};
}

/* ---- « Avec les étapes » : les cases, chacune jugée seule ---- */
function lneCases(A){
  const q=A.q, C=[];
  const mf=(id,nom,tex,plain,juge,grp)=>C.push({id:id, mf:true, nom:nom, tex:tex, plain:plain, juge:juge, grp:grp||null});
  const tx=(id,nom,v,grp)=>C.push({id:id, mf:false, nom:nom, v:v, s:numFmt(v), grp:grp||null});
  const facteurs=[{tex:A.uTex, plain:A.uPlain, f:A.fu},{tex:A.vTex, plain:A.vPlain, f:A.fv}];
  ['1','2'].forEach(function(l){
    mf('lne-f'+l+'a','premier facteur',facteurs[0].tex,facteurs[0].plain,null,'f'+l);
    mf('lne-f'+l+'b','second facteur',facteurs[1].tex,facteurs[1].plain,null,'f'+l);
    if(l==='1' && q.rhs!=='zero') tx('lne-k1','le nombre dans le logarithme du second membre',A.K);
    if(l==='2') tx('lne-k2','le second membre',A.K);
  });
  const P=A.P;
  mf('lne-dev','le produit développé',lnePolyTex(P.A,P.B,P.C),lnePolyPlain(P.A,P.B,P.C),'dev');
  tx('lne-k3','le second membre',A.K);
  mf('lne-red','le trinôme réduit',lnePolyTex(P.A,P.B,P.C-A.K),lnePolyPlain(P.A,P.B,P.C-A.K),'red');
  tx('lne-delta','le discriminant',A.delta);
  if(A.double) tx('lne-x0','la racine double',A.racines[0]);
  else { tx('lne-x1','une racine',A.racines[0],'x'); tx('lne-x2','l’autre racine',A.racines[1],'x'); }
  mf('lne-S','les solutions dans I',A.Stex,A.Splain,'S');
  return C;
}
function lneFormHTML(q){
  const A=lneAns(q), libre=(lneModeLib()==='libre');
  let h='<div class="lnd-modes" role="group" aria-label="façon de résoudre l’équation">'
    +'<button type="button" class="btn lnd-m'+(libre?'':' on')+'" aria-pressed="'+(!libre)+'" onclick="lneChoisirMode(\'etapes\')">Avec les étapes</button>'
    +'<button type="button" class="btn lnd-m'+(libre?' on':'')+'" aria-pressed="'+libre+'" onclick="lneChoisirMode(\'libre\')">Sans étape</button></div>';
  h+='<div class="tg-line lnd-dep">'+mlTex(A.eqTex, A.eqHtml)+'</div>';
  if(!libre){
    const C=lneCases(A), byId={}; C.forEach(c=>byId[c.id]=c);
    const box=function(id){ const c=byId[id];
      if(c.mf) return '<math-field class="dexp-mf'+(id==='lne-dev'||id==='lne-red'?' dexp-mf-wide':'')+'" id="'+id+'" aria-label="'+esc(c.nom)+'"></math-field>';
      return txInp(id,'lne-n'); };
    const cap=t=>'<span class="dexp-hint lne-cap">← '+t+'</span>';
    const eq='<span class="tg-eq">⟺</span> ';
    const rhs1=q.rhs==='zero'?'0':'ln( '+box('lne-k1')+' )';
    h+='<p class="tvi-instr lnd-instr">Complète chaque étape. On utilise : '+lneAstuce(q)+'</p>';
    h+='<div class="tg-line lne-l">'+eq+'ln[ ( '+box('lne-f1a')+' ) × ( '+box('lne-f1b')+' ) ] = '+rhs1
      +cap(q.rhs==='somme'?'ln <i>a</i> + ln <i>b</i> = ln(<i>a</i> × <i>b</i>), des deux côtés':'ln <i>a</i> + ln <i>b</i> = ln(<i>a</i> × <i>b</i>)')+'</div>';
    h+='<div class="tg-line lne-l">'+eq+'( '+box('lne-f2a')+' ) × ( '+box('lne-f2b')+' ) = '+box('lne-k2')
      +cap(q.rhs==='zero'?'ln <i>A</i> = 0 ⟺ <i>A</i> = 1':'ln <i>A</i> = ln <i>B</i> ⟺ <i>A</i> = <i>B</i>')+'</div>';
    h+='<div class="tg-line lne-l">'+eq+box('lne-dev')+' = '+box('lne-k3')+cap('<b>développe</b> le membre de gauche')+'</div>';
    h+='<div class="tg-line lne-l">'+eq+box('lne-red')+' = 0'+cap('passe tout dans le membre de gauche, puis <b>réduis</b>')+'</div>';
    h+='<div class="tg-line lne-l lne-delta">Δ = '+box('lne-delta')+cap('le discriminant du trinôme')+'</div>';
    if(A.double) h+='<div class="tg-line lne-l">Racine double : <i>x</i><sub>0</sub> = '+box('lne-x0')+cap('<i>x</i><sub>0</sub> = −<i>b</i>/(2<i>a</i>)')+'</div>';
    else h+='<div class="tg-line lne-l">Racines : <i>x</i><sub>1</sub> = '+box('lne-x1')+' et <i>x</i><sub>2</sub> = '+box('lne-x2')+cap('(−<i>b</i> ± √Δ)/(2<i>a</i>)')+'</div>';
    h+='<div class="tg-line lne-l">Sur <i>I</i> = '+A.Ihtml+' : <i>S</i> = { '+box('lne-S')+' }'+cap('ne garde que les racines qui sont dans <i>I</i>')+'</div>';
    h+='<p class="dexp-hint">Deux solutions s’écrivent séparées par un point-virgule : 1 ; 4.</p>';
  } else {
    h+='<p class="tvi-instr lnd-instr">Écris une équation par ligne, jusqu’aux solutions (<i>x</i> = … ou <i>S</i> = {…}). Tu peux sauter des étapes : chaque équation équivalente sur <i>I</i> = '+A.Ihtml+' est acceptée.</p>'
      +'<div class="lne-outils"><button type="button" class="btn lne-ou" onmousedown="event.preventDefault()" onclick="lneInsererOu()" aria-label="écrire « ou » dans la ligne">« ou »</button></div>'
      +'<div class="dexp2-sheet pts-case" id="lneSheet"></div>'
      +'<p class="dexp-hint"><b>Entrée</b> (ou la touche <b>⏎</b>) ajoute une ligne ; <b>retour arrière</b> sur une ligne vide la supprime. Au clavier : <b>ln</b> s’écrit l, n ; <b>^</b> exposant ; Δ s’écrit <b>Delta</b> ; <i>x</i><sub>1</sub> s’écrit x_1 ; deux solutions : « <i>x</i> = 1 ou <i>x</i> = 4 », le mot « ou » par son bouton.</p>';
  }
  return h;
}
/* « ou » tapé au clavier se colle aux lettres (« −1oux ») : le bouton l'écrit
   en texte, espaces comprises, dans la ligne où était le curseur */
function lneInsererOu(){
  if(test.locked || !lneFeuille) return;
  const mf=lneFeuille.derniere || (lneFeuille.lignes[lneFeuille.lignes.length-1]||{}).mf; if(!mf) return;
  try{ mf.focus(); mf.insert('\\text{ ou }',{selectionMode:'after', insertionMode:'replaceSelection'}); }catch(e){}
  try{ mf.mode='math'; }catch(e){}   /* le curseur ressort du texte : « x = 4 » s'écrit en maths */
}
function lneModeLib(){ return test.lneMode==='libre'?'libre':'etapes'; }
function lneChoisirMode(m){
  if(test.locked || lneModeLib()===m) return;
  test.lneMode=m; test.lneLignes=null; autoSave(); renderLNE();
}
async function startLNE(){
  if(!currentEleve){ accueil(); return; }
  recoveryRowId=null; recoveryClosed=false;
  cfg=await loadConfig();
  currentTestId='ln-resoudre-equation'; test.kind='lne';
  test.questions=lneGen();
  test.idx=0;test.score=0;test.answers=[];test.startTime=Date.now();test.locked=false;
  test.lneMode=test.lneMode==='libre'?'libre':'etapes'; test.lneLignes=null;
  test.maxScore=test.questions.length;
  show('lne'); renderLNE();
}
function renderLNE(){
  const q=test.questions[test.idx]; test.locked=false;
  const A=lneAns(q);
  $('lneQIdx').textContent='Question '+(test.idx+1)+' / '+test.questions.length;
  $('lneModeTag').innerHTML=modeTagHTML();
  $('lneLiveScore').textContent=test.score;
  $('lneFeedback').textContent=''; $('lneFeedback').className='mp-feedback';
  $('lneActions').innerHTML=conseilInlineBtn()+'<button class="btn btn-primary" onclick="checkLNE()">Vérifier</button>';
  $('lnePrompt').innerHTML='Résoudre <b>'+mlTex(A.eqTex, A.eqHtml)+'</b> sur <i>I</i> = '+A.Ihtml+'.';
  $('lneForm').innerHTML=lneFormHTML(q);
  lneFeuille=null;
  if(lneModeLib()==='libre'){
    lneFeuille=mlFeuille({ conteneur:'lneSheet', mode:'calcul', prefixes:{premiere:'⟺', suite:'⟺'}, prefixesTexte:{premiere:'⟺', suite:'⟺'} });
    /* la feuille n'a aucun id : elle voyage dans test (le motif du 9.2.1) */
    const brouillon=Array.isArray(test.lneLignes)?test.lneLignes:null;
    if(brouillon&&brouillon.length) brouillon.forEach(function(v,i){
      const L=lneFeuille.lignes[i]||lneFeuille.ajouterLigne(i-1);
      if(L){ try{ L.mf.setValue(String(v)); }catch(e){} } });
    const sh=$('lneSheet');
    if(sh){
      const noter=function(){ try{ test.lneLignes=lneFeuille.lignes.map(L=>L.mf.getValue()); }catch(e){} };
      sh.addEventListener('input', noter); sh.addEventListener('focusout', noter);
      /* la feuille se juge à la SORTIE, jamais à la frappe */
      if(isSoutien()) sh.addEventListener('focusout', function(){ setTimeout(function(){ if(!test.locked) checkLNE(true); },0); });
    }
  } else {
    if(window.mlDexp) window.mlDexp.upgrade($('lneForm'));
    if(isSoutien()) $('lneForm').querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>checkLNE(true)));
    /* les cases MathLive se colorent à leur SORTIE : dexpLiveCheck route vers checkLNE(true) */
  }
}
/* les verdicts des étapes : V (juste), ecrit (la correction : {tex, plain} ou texte) */
function lneVerdictsEtapes(A){
  const C=lneCases(A), lu={}, V={}, cor={};
  C.forEach(c=>{ lu[c.id]=lneVal(c.id); });
  const facts=[A.fu, A.fv], fTex=[{tex:A.uTex,plain:A.uPlain},{tex:A.vTex,plain:A.vPlain}];
  /* les paires de facteurs, dans l'ordre qui donne le plus de cases justes */
  ['f1','f2'].forEach(function(g){
    const a=g==='f1'?'lne-f1a':'lne-f2a', b=g==='f1'?'lne-f1b':'lne-f2b';
    const ok=(id,k)=>lu[id]!=='' && lneVautFn(lu[id], facts[k]);
    const d=(ok(a,0)?1:0)+(ok(b,1)?1:0), x=(ok(a,1)?1:0)+(ok(b,0)?1:0);
    if(x>d){ V[a]=ok(a,1); V[b]=ok(b,0); cor[a]=fTex[1]; cor[b]=fTex[0]; }
    else { V[a]=ok(a,0); V[b]=ok(b,1); cor[a]=fTex[0]; cor[b]=fTex[1]; }
  });
  const P=A.P, prod=x=>P.A*x*x+P.B*x+P.C;
  /* le développé : u × v, sans parenthèse */
  V['lne-dev']=lu['lne-dev']!=='' && lneVautFn(lu['lne-dev'], prod) && lneDeveloppe(lu['lne-dev']);
  /* le réduit : λ(u × v − K), un terme par degré */
  let lambda=null;
  if(lu['lne-red']!==''){
    const n=lneLireX(lu['lne-red']);
    if(n){ const v0=lndEval(n,{x:LNE_X[0]}), t0=prod(LNE_X[0])-A.K;
      if(Math.abs(t0)>1e-9 && isFinite(v0)){ const l=v0/t0;
        if(Math.abs(l)>1e-9 && lneVautFn(lu['lne-red'], x=>l*(prod(x)-A.K)) && lneReduit(lu['lne-red'])) lambda=l; } }
  }
  V['lne-red']=lambda!==null;
  const nb=id=>{ const v=lneNombre(lu[id]); return v; };
  ['lne-k1','lne-k2','lne-k3'].forEach(function(id){ if(id in lu){ const v=nb(id); V[id]=v!==null && Math.abs(v-A.K)<1e-9; } });
  V['lne-delta']=(function(){ const v=nb('lne-delta'); return v!==null && lneDeltaOk(A, v, lambda); })();
  if(A.double){ const v=nb('lne-x0'); V['lne-x0']=v!==null && Math.abs(v-A.racines[0])<1e-9; }
  else {
    const r=A.racines, e=(id,k)=>{ const v=nb(id); return v!==null && Math.abs(v-r[k])<1e-9; };
    const d=(e('lne-x1',0)?1:0)+(e('lne-x2',1)?1:0), x=(e('lne-x1',1)?1:0)+(e('lne-x2',0)?1:0);
    if(x>d){ V['lne-x1']=e('lne-x1',1); V['lne-x2']=e('lne-x2',0); cor['lne-x1']=numFmt(r[1]); cor['lne-x2']=numFmt(r[0]); }
    else { V['lne-x1']=e('lne-x1',0); V['lne-x2']=e('lne-x2',1); }
  }
  V['lne-S']=lu['lne-S']!=='' && lneMemeEnsemble(lneListe(lu['lne-S']), A.S);
  return {C:C, V:V, lu:lu, cor:cor};
}
function checkLNE(live){
  if(test.locked && !live) return;
  const q=test.questions[test.idx], A=lneAns(q), fb=$('lneFeedback');
  const last=test.idx===test.questions.length-1;
  const suite=()=>{ $('lneActions').innerHTML='<button class="btn btn-primary" onclick="nextLNE()">'+(last?'Voir mes résultats':'Question suivante')+'</button>'; };
  const reverifier=()=>{ $('lneActions').innerHTML=conseilInlineBtn()+'<button class="btn btn-primary" onclick="checkLNE()">Revérifier</button>'; };
  if(lneModeLib()==='libre'){
    const v=lneVerdictFeuille(A), sh=$('lneSheet');
    if(lneFeuille) lneFeuille.lignes.forEach(L=>L.line.classList.remove('ok','bad','sol'));
    v.lignes.forEach(x=>x.L.line.classList.add(x.ok?'ok':'bad'));
    if(live) return;
    if(v.vide){ fb.textContent='Écris au moins une équation avant de vérifier.'; fb.className='mp-feedback'; return; }
    if(!v.ok && isSoutien()){
      fb.innerHTML=v.justes?'Tes équations sont justes — continue jusqu’aux solutions : « <i>x</i> = … » ou « <i>S</i> = {…} », seulement celles qui sont dans <i>I</i>.'
        :'Une équation n’est pas équivalente à la précédente sur <i>I</i> (en rouge) : corrige-la, puis revérifie.';
      fb.className='mp-feedback bad'; reverifier(); return;
    }
    test.locked=true;
    if(sh){ sh.classList.remove('ok','bad','sol'); sh.classList.add(v.ok?'ok':'bad'); }
    if(v.ok){
      test.score++; $('lneLiveScore').textContent=test.score;
      fb.textContent=pick(['Parfait !','Très bien, c’est résolu !','Excellent !','Bravo !']); fb.className='mp-feedback good';
    } else {
      fb.innerHTML=(v.justes?'Tes équations sont justes, mais tu n’es pas arrivé aux solutions.':'Une équation au moins n’est pas équivalente (en rouge).')
        +' <span class="msg-sol">La conclusion attendue est écrite en <b>vert</b>.</span>';
      fb.className='mp-feedback bad';
      if(sh && !(sh.nextElementSibling&&sh.nextElementSibling.classList.contains('mf-cor')))
        sh.insertAdjacentHTML('afterend','<span class="mf-cor lne-cor"><i>S</i> = { '+A.Splain+' } : '+A.conclusion.replace(/x/g,'<i>x</i>')+'</span>');
    }
    if(lneFeuille) lneFeuille.verrouiller();
    test.answers.push({...(ptsExo()||{}), q:'Résoudre '+A.eqPlain+' sur I = '+A.Ihtml+' (sans étape)', answer:'S = {'+A.Splain+'}', given:v.ok?'✓':'incomplet', correct:v.ok, type:'tvi'});
    suite(); return;
  }
  /* avec les étapes */
  const E=lneVerdictsEtapes(A);
  let allOk=true, vides=0, anyFilled=false;
  E.C.forEach(c=>{ const el=$(c.id); if(!el) return;
    const vide=E.lu[c.id]==='', ok=!vide && E.V[c.id];
    if(!vide) anyFilled=true; if(vide){ vides++; allOk=false; } else if(!ok) allOk=false;
    el.classList.remove('ok','bad'); if(!vide) el.classList.add(ok?'ok':'bad');
  });
  if(live) return;
  if(!anyFilled){ fb.textContent='Complète au moins une case avant de vérifier.'; fb.className='mp-feedback'; return; }
  if(!allOk && isSoutien()){
    const dev=E.lu['lne-dev']!=='' && !E.V['lne-dev'] && lneVautFn(E.lu['lne-dev'], x=>A.P.A*x*x+A.P.B*x+A.P.C);
    const red=E.lu['lne-red']!=='' && !E.V['lne-red'] && lneLireX(E.lu['lne-red']) && !lneReduit(E.lu['lne-red']);
    fb.innerHTML=vides>0?'Il te manque '+vides+' case(s) — complète-les, puis corrige les cases en rouge et revérifie.'
      :(dev?'Le produit est juste mais pas encore <b>développé</b> : enlève les parenthèses.'
      :(red?'Le membre de gauche n’est pas encore <b>réduit</b> : un seul terme en <i>x</i>², un seul en <i>x</i>, une seule constante.'
      :'Presque ! Corrige les cases en rouge, puis revérifie.'));
    fb.className='mp-feedback bad';
    E.C.forEach(c=>{ const el=$(c.id); if(!el) return; if(c.mf) el.readOnly=!!E.V[c.id]; else el.disabled=!!E.V[c.id]; });
    reverifier(); return;
  }
  test.locked=true;
  if(allOk){
    test.score++; $('lneLiveScore').textContent=test.score;
    fb.textContent=pick(['Parfait !','Très bien, c’est résolu !','Excellent !','Bravo !']); fb.className='mp-feedback good';
    E.C.forEach(c=>{ const el=$(c.id); if(!el) return; if(c.mf) el.readOnly=true; else el.disabled=true; });
  } else {
    fb.innerHTML=msgCorrCouleurs(vides>0); fb.className='mp-feedback bad';
    E.C.forEach(function(c){
      const vide=E.lu[c.id]==='', ok=!vide && !!E.V[c.id];
      if(c.mf){ const k=E.cor[c.id]||{tex:c.tex, plain:c.plain}; rfReveal(c.id, k.tex, k.plain, ok, vide); }
      else { corrCase(c.id, E.cor[c.id]||c.s, ok); const el=$(c.id); if(el) el.disabled=true; }
    });
  }
  test.answers.push({...(ptsExo()||{}), q:'Résoudre '+A.eqPlain+' sur I = '+A.Ihtml+' (avec les étapes)', answer:'S = {'+A.Splain+'}', given:allOk?'✓':'incomplet', correct:allOk, type:'tvi'});
  suite();
}
function nextLNE(){ if(test.idx<test.questions.length-1){ test.idx++; test.lneLignes=null; renderLNE(); } else finishTest(); }
function lneConseilCtx(){
  const q=test.questions[test.idx], A=lneAns(q), libre=lneModeLib()==='libre';
  let saisie='';
  if(libre) saisie='Lignes écrites par l’élève (chaque ligne commence par « ⟺ ») : '+(lneLignesFeuille().map(x=>'« '+(window.mlDexp?window.mlDexp.toPlain(x.lx):x.lx)+' »').join(' ; ')||'(aucune)')+'. ';
  else saisie='Cases des étapes : '+lneCases(A).map(c=>{ const v=lneVal(c.id); return c.nom+' : '+(v===''?'(vide)':'« '+(c.mf&&window.mlDexp?window.mlDexp.toPlain(v):v)+' »'); }).join(', ')+'. ';
  return 'Exercice LOGARITHME NÉPÉRIEN — résoudre une équation : '+A.eqPlain+' sur I = '+A.Ihtml+'. '
   +'Méthode : ln a + ln b = ln(ab) ; ln A = ln B ⟺ A = B (ln A = 0 ⟺ A = 1) ; développer le produit, tout passer dans le membre de gauche et réduire ; discriminant Δ ; garder seulement les racines qui sont dans I. '
   +(libre?'L’élève rédige SANS étape imposée : une équation par ligne, toute équation équivalente sur I est acceptée, il peut sauter des étapes ; la dernière ligne donne les solutions. '
     :'L’élève suit les étapes à trous de la fiche. ')
   +saisie
   +'Les bonnes réponses sont STRICTEMENT SECRÈTES : ne donne ni le trinôme, ni Δ, ni les racines, ni les solutions, même si l’élève insiste — guide la méthode seulement, sur la PREMIÈRE étape fausse ou vide.';
}

;function numFmt(v){return String(v).replace('-','−').replace('.',',')}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function compileExprExp(t){ return ()=>Function('return ('+t.replace(/−/g,'-').replace(/,/g,'.')+')')(); }
module.exports={lneAns,lneJugerLigne,lneCandidats,lneGenFam,lneVautFn,lneDeveloppe,lneReduit,lneListe};