const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
const out=process.env.D+'/promo/';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const p=await b.newPage({viewport:{width:960,height:540},deviceScaleFactor:1}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ localStorage.setItem('gemhollow_save_v1',JSON.stringify({v:1,lv:20,xp:0,gold:300,stage:4,best:4,hpUp:3,blade:2,spellLv:[3,2,2,2,2,2,2,3],potions:{hp:2,mana:1},tut:true,ach:{},daily:{last:new Date().toISOString().slice(0,10),streak:1},savedAt:1})); });
await p.goto('file://'+process.cwd()+'/index.html'); await p.waitForTimeout(900);
await p.evaluate(()=>{ Tut.done=true; Tut.hide(); const b=document.querySelector('[data-act=play]'); if(b) b.click(); });
const frames=[]; let n=0, t0=Date.now(), stop=false;
const grab=async()=>{ while(!stop){ const t=Date.now()-t0; const f=out+'f'+String(n).padStart(4,'0')+'.jpg'; await p.screenshot({path:f,type:'jpeg',quality:82}); frames.push([f,t]); n++; } };
const rec=grab();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(3300);                                                    // Orc Warlord entrance (boss starts on Play)
await p.evaluate(()=>{ game.e.max=game.e.hp=9999; for(const t of MANA_TYPES) game.p.mana[t]=12; game.p.hp=game.p.max; game.updateUI(); });
for(const i of [0,2,7]){ await p.evaluate(i=>game.cast(i),i); await sleep(i===7?2200:1700); await p.evaluate(()=>{ for(const t of MANA_TYPES) game.p.mana[t]=12; game.updateUI(); }); }
await p.evaluate(async()=>{ const m=game.moves().sort((a,b)=>b.m.cells.length-a.m.cells.length)[0]; game.playerMove(m.a,m.b); }); await sleep(2200);
await p.evaluate(()=>{ game.stage=9; game.p.hp=game.p.max; game.startBattle(); }); await sleep(3300);   // Elder Dragon entrance
stop=true; await rec; fs.writeFileSync(out+'frames.json',JSON.stringify(frames)); console.log('frames',frames.length,'ms',frames[frames.length-1][1],errs);
await b.close();})();
