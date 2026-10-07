const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:720}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&!/ERR_TUNNEL|Failed to load/.test(m.text())&&errs.push(m.text()));
await p.addInitScript(()=>{ window.__wins=0; window.__loses=0; });
await p.goto('file://'+process.cwd()+'/index.html?fast'); await p.waitForTimeout(300); await p.evaluate(()=>{const b=document.querySelector('[data-act=play]'); b&&b.click();});
const R={};
// 1) no-moves reshuffle
R.reshuffle=await p.evaluate(async()=>{
  // find a pattern with no moves
  let found=null;
  for(let a=1;a<=3&&!found;a++)for(let bb=1;bb<=4&&!found;bb++)for(let k=4;k<=6&&!found;k++){
    for(let r=0;r<N;r++)for(let c=0;c<N;c++) game.b[r][c]=game.mk(r,c,((a*r+bb*c)%k)%6);
    if(!game.findMatches().cells.length && !game.moves().length) found=[a,bb,k];
  }
  if(!found) return 'no pattern found';
  const before=game.moves().length; await game.ensureMoves();
  return {pattern:found,before,after:game.moves().length,matches:game.findMatches().cells.length};
});
// 2) win exactly once: low-HP enemy, many random moves + Smite/Fireball kills
R.win=await p.evaluate(async()=>{
  const out={wins:0,multi:0,errors:0};
  const origWin=Game.prototype.winBattle; let count=0; Game.prototype.winBattle=async function(){ count++; return origWin.call(this); };
  for(let i=0;i<25;i++){
    closePanel(); game.startBattle(); game.e.hp=1+Math.floor(Math.random()*10); game.e.max=Math.max(game.e.max,game.e.hp); count=0;
    for(const t of MANA_TYPES) game.p.mana[t]=12;
    if(i%3===0){ await game.cast(3); }                       // Smite kills via per-skull damage + cascade
    else if(i%3===1){ await game.cast(0); }
    else { for(let k=0;k<6&&!game.over;k++){ const m=game.moves(); await game.playerMove(m[0].a,m[0].b); } }
    await new Promise(r=>setTimeout(r,0));
    if(game.e.hp<=0){ out.wins++; if(count!==1) out.multi++; }
  }
  Game.prototype.winBattle=origWin; return out;
});
// 3) die exactly once (enemy cascades)
R.lose=await p.evaluate(async()=>{
  const out={loses:0,multi:0}; const orig=Game.prototype.lose; let count=0; Game.prototype.lose=async function(){ count++; return orig.call(this); };
  for(let i=0;i<20;i++){
    closePanel(); game.startBattle(); game.p.hp=1+Math.floor(Math.random()*6); game.e.atk=30; game.e.hp=game.e.max=500; count=0;
    for(let k=0;k<10&&!game.over;k++){ const m=game.moves(); await game.playerMove(m[0].a,m[0].b); }
    if(game.p.hp<=0){ out.loses++; if(count!==1) out.multi++; }
  }
  Game.prototype.lose=orig; return out;
});
// 4) concurrency: spells/moves/potions while busy, during enemy turn
R.concurrent=await p.evaluate(async()=>{
  closePanel(); FAST=false; game.startBattle(); for(const t of MANA_TYPES) game.p.mana[t]=12; game.p.potions.hp=3; game.p.hp=20;
  const m=game.moves()[0]; const turns0=game.moveCount;
  const a=game.playerMove(m.a,m.b); const b2=game.playerMove(m.a,m.b); const c=game.cast(0); const d=game.cast(7); game.usePotion('hp');
  await Promise.all([a,b2,c,d]);
  const mc=game.moveCount-turns0; const mana=Object.values(game.p.mana).join(',');
  FAST=true; return {moveCountDelta:mc, mana, potions:game.p.potions.hp, hp:game.p.hp, busy:game.busy, turn:game.turn};
});
// 5) refresh mid-battle then continue
await p.evaluate(()=>{ closePanel(); game.startBattle(); game.p.mana[1]=3; });
await p.reload(); await p.waitForTimeout(300);
R.reload=await p.evaluate(()=>({btn:document.querySelector('[data-act=play]').textContent,stage:game.stage,hp:game.p.hp,max:game.p.max,over:game.over}));
await p.evaluate(()=>{const b=document.querySelector('[data-act=play]'); b&&b.click();}); await p.waitForTimeout(100);
// 6) storage blocked / corrupt save
const p2=await ctx.newPage(); const e2=[]; p2.on('pageerror',e=>e2.push(e.message));
await p2.addInitScript(()=>{ Object.defineProperty(window,'localStorage',{get(){ throw new Error('blocked'); }}); });
await p2.goto('file://'+process.cwd()+'/index.html?fast'); await p2.waitForTimeout(300); await p2.evaluate(()=>{const b=document.querySelector('[data-act=play]'); b&&b.click();});
R.noStorage=await p2.evaluate(async()=>{ game.e.hp=1; const m=game.moves(); await game.playerMove(m[0].a,m[0].b); await game.cast(0).catch(()=>{}); return {ok:true,over:game.over}; });
const p3=await ctx.newPage(); const e3=[]; p3.on('pageerror',e=>e3.push(e.message));
await p3.addInitScript(()=>{ localStorage.setItem('gemhollow_save_v1','{"lv":"x","xp":null,"gold":-5,"stage":"7","spellLv":[9,0,"a"],"potions":{"hp":"z"}}'); localStorage.setItem('gemhollow_settings_v1','not json'); });
await p3.goto('file://'+process.cwd()+'/index.html?fast'); await p3.waitForTimeout(300);
R.corrupt=await p3.evaluate(()=>({lv:game.p.lv,xp:game.p.xp,gold:game.p.gold,stage:game.stage,spell:game.p.spellLv.join(','),pot:JSON.stringify(game.p.potions),hp:game.p.hp,max:game.p.max}));
console.log(JSON.stringify(R,null,1)); console.log('errs',errs,e2,e3); await b.close();})();
