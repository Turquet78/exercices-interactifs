let D=new Set(),D2=new Set(),Dall=new Set(),same=0,tot=0;
for(const s of [1,-1]) for(const c of [-2,-1,0,1,2]) for(const x1 of [-2,-1,0]) for(const x2 of [x1+2,x1+3,x1+4].filter(v=>v<=2)){
  const g=x=>s*x+c; if(Math.abs(g(x1))>3||Math.abs(g(x2))>3) continue;
  for(const milieu of [1,-1]){
   const cand=[];
   for(let x=-3;x<=3;x++){ const gv=g(x); if(x===x1||x===x2){cand.push([gv]);continue;}
     const cote=(x>x1&&x<x2)?milieu:-milieu; const cs=[]; for(let v=-3;v<=3;v++) if(cote*(v-gv)>=1) cs.push(v); cand.push(cs);}
   if(cand.some(a=>!a.length)) continue;
   const rec=(i,pts)=>{ if(i===7){ check(pts.slice(),s,c,x1,x2,g); return;} for(const v of cand[i]){pts[i]=v;rec(i+1,pts);} };
   rec(0,[]);
  }}
function check(pts,s,c,x1,x2,g){
  const trav=y=>{for(let i=0;i<6;i++){const lo=Math.min(pts[i],pts[i+1]),hi=Math.max(pts[i],pts[i+1]); if(y>lo&&y<hi) return true;} return false;};
  const ixs=y=>{const ix=[];for(let x=-3;x<=3;x++) if(pts[x+3]===y) ix.push(x); return ix;};
  const kaOk=y=>{ if(trav(y)) return 0; const ix=ixs(y); if(ix.length<1||ix.length>2) return 0; if(ix.length===2&&ix[1]-ix[0]<2) return 0;
    const xa=(y-c)/s; if(!Number.isInteger(xa)||xa<-2||xa>2) return 0; if(ix.includes(xa)) return 0; if(g(x1)===y||g(x2)===y) return 0; return ix.length;};
  const kas=[];for(let y=-3;y<=3;y++){const n=kaOk(y); if(n) kas.push([y,n]);}
  if(!kas.length) return;
  const r2=kas.filter(a=>a[1]===2); const kaL=(r2.length?r2:kas);
  const key=pts.join()+'|'+s+c;
  for(const [ka,n] of kaL){
    const kc=[];for(let y=-3;y<=3;y++){ if(trav(y)) continue; const ix=ixs(y); if(ix.length!==2||ix[1]-ix[0]<2) continue;
       if(y===ka||g(x1)===y||g(x2)===y) continue; if(!(ix[0]>-3&&ix[1]<3)) continue; kc.push(y);}
    if(!kc.length) continue;
    Dall.add(key);
    const ki=[];for(let y=-3;y<=3;y++){ if(trav(y)) continue; const ix=ixs(y); if(ix.length!==2||ix[1]-ix[0]<2) continue;
       if(!(ix[0]>-3&&ix[1]<3)) continue; if(ix.every(x=>(pts[x+2]-y)*(pts[x+4]-y)<0)) ki.push(y);}
    if(ki.length){ D.add(key); if(n===2) D2.add(key); }
  }
}
console.log('ancien',Dall.size,'avec ki',D.size,'ka double',D2.size);
