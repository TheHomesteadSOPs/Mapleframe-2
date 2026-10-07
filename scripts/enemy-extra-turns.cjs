const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html?fast'); await p.waitForTimeout(300); await p.click('[data-act=play]');
const r=await p.evaluate(async()=>{
  const out={};
  // Case 1: only available match for the enemy is a 4-in-a-row (non-skull) -> it must take an extra turn
  const base=()=>{ for(let r=0;r<N;r++)for(let c=0;c<N;c++) game.b[r][c]=game.mk(r,c,((2*r+3*c)%5)===1?2:((2*r+3*c)%5)); };
  let moves=0; const origRes=game.resolve.bind(game); game.resolve=async function(who,f){ if(who==='enemy') moves++; return origRes(who,f); };
  const logs=[]; const origLog=game.log.bind(game); game.log=t=>{ logs.push(t); origLog(t); };
  let extras=0, trials=30, withExtraAvail=0;
  for(let i=0;i<trials;i++){
    game.stage=3; game.startBattle(); game.e.abil=[]; game.e.hp=game.e.max=999; game.p.hp=game.p.max=999;
    // random real board; count how many enemy moves resolve in one enemy turn when a 4+/L/T move exists
    const ms=game.moves(); const has4=ms.some(m=>m.m.runs.some(x=>x.length>=4)||game.groupSizes(m.m.runs).some(g=>g>=5));
    moves=0; logs.length=0; game.turn='player'; game.busy=false; await game.enemyTurn();
    if(has4){ withExtraAvail++; if(moves>=2||logs.some(l=>/extra turn/.test(l))) extras++; }
  }
  out.boardsWithExtraMoveAvailable=withExtraAvail; out.enemyTookExtraTurn=extras;
  return out; });
console.log(JSON.stringify(r),errs); await b.close();})();
