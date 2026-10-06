const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
for(const reduced of [false,true]){
  const ctx=await b.newContext({viewport:{width:1280,height:720},reducedMotion:reduced?'reduce':'no-preference'}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem('gemhollow_save_v1',JSON.stringify({v:1,lv:4,xp:0,gold:0,stage:4,best:4,hpUp:0,blade:0,spellLv:[1,1,1,1,1,1,1,1],potions:{hp:1,mana:0},tut:true,savedAt:1})); });
  await p.goto('file://'+process.cwd()+'/index.html'); await p.waitForTimeout(300);
  const before=await p.evaluate(()=>({stage:game.stage,boss:game.e.boss,track:Snd.track,intro:!!game.intro}));
  await p.click('[data-act=play]'); await p.waitForTimeout(400);
  const during=await p.evaluate(()=>({busy:game.busy,intro:!!game.intro,canSwap:(()=>{ const m=game.moves()[0]; game.playerMove(m.a,m.b); return game.moveCount; })()}));
  await p.waitForTimeout(2600);
  const after=await p.evaluate(()=>({busy:game.busy,intro:!!game.intro,track:Snd.track,name:TRACKS[Snd.track].n,turn:game.turn}));
  await p.evaluate(async()=>{ const m=game.moves()[0]; await game.playerMove(m.a,m.b); });
  const moved=await p.evaluate(()=>game.moveCount);
  console.log('reduced',reduced,JSON.stringify({before,during,after,moved}),errs);
  await ctx.close(); }
await b.close();})();
