const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html?fast'); await p.waitForTimeout(300); await p.click('[data-act=play]');
const res=await p.evaluate(async()=>{
  // fill with a no-match pattern (types 0..4 diagonal) then stamp shapes of type 1 (RED)
  const base=()=>{ for(let r=0;r<N;r++)for(let c=0;c<N;c++) game.b[r][c]=game.mk(r,c,(2*r+3*c)%5===1?2:((2*r+3*c)%5)+(((2*r+3*c)%5)===1?0:0)); };
  const stamp=(cells)=>{ for(const [r,c] of cells) game.b[r][c]=game.mk(r,c,1); };
  const shapes={
    L:[[2,2],[2,3],[2,4],[3,2],[4,2]],
    T:[[2,2],[2,3],[2,4],[3,3],[4,3]],
    plus:[[3,2],[3,3],[3,4],[2,3],[4,3]],
    three:[[2,2],[2,3],[2,4]],
    four:[[2,2],[2,3],[2,4],[2,5]],
    twoSeparate3:[[1,1],[1,2],[1,3],[5,5],[6,5],[7,5]],
  };
  const out={};
  for(const [name,cells] of Object.entries(shapes)){
    base();
    // remove accidental matches from the base pattern, then stamp
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){ const g=game.b[r][c]; if(g.t===1) g.t=2; }
    stamp(cells);
    const m=game.findMatches(); const sizes=game.groupSizes(m.runs);
    out[name]={runs:m.runs.map(r=>r.length).join(','),groups:sizes.join(','),extra:m.runs.some(r=>r.length>=4)||sizes.some(n=>n>=5)};
  }
  // end-to-end: resolve must report an extra turn for an L
  base(); for(let r=0;r<N;r++)for(let c=0;c<N;c++){ if(game.b[r][c].t===1) game.b[r][c].t=2; } stamp(shapes.L);
  game.e.hp=game.e.max=999; game.turn='player'; const extra=await game.resolve('player'); out.resolveL=extra;
  return out; });
console.log(JSON.stringify(res,null,1)); console.log(errs); await b.close();})();
