const SS=JSON.parse(process.argv[2]), CC=JSON.parse(process.argv[3]);
let D=new Set(),D2=new Set(),D1=new Set();
for(const s of SS) for(const c of CC) for(const x1 of [-2,-1,0]) for(const x2 of [x1+2,x1+3,x1+4].filter(v=>v<=2)){
  const g=x=>s*x+c; if(!Number.isInteger(g(x1))||!Number.isInteger(g(x2))) continue; if(Math.abs(g(x1))>3||Math.abs(g(x2))>3) continue;
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
  const key=pts.join()+'|'+s+c;
  for(let ka=-3;ka<=3;ka++){ const n=kaOk(ka); if(!n) continue;
    const kc=[];for(let y=-3;y<=3;y++){ if(trav(y)) continue; const ix=ixs(y); if(ix.length!==2||ix[1]-ix[0]<2) continue;
       if(y===ka||g(x1)===y||g(x2)===y) continue; if(!(ix[0]>-3&&ix[1]<3)) continue; if(ix.every(x=>(pts[x+2]-y)*(pts[x+4]-y)<0)) kc.push(y);}
    if(kc.length){ D.add(key); (n===2?D2:D1).add(key);} }
}
console.log(process.argv[2],process.argv[3],'dessins',D.size,'ka1',D1.size,'ka2',D2.size);
