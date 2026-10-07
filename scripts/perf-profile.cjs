const {chromium}=require('playwright');
(async()=>{
const rate=parseFloat(process.argv[2]||'6');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true}); const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate});
await p.goto('file://'+process.cwd()+'/index.html'); await p.waitForTimeout(500); await p.click('[data-act=play]'); await p.waitForTimeout(300);
await p.evaluate(()=>{ Tut.hide(); const o=Game.prototype.loop; window.__t=[]; Game.prototype.loop=function(t){ const s=performance.now(); const r=o.call(this,t); window.__t.push(performance.now()-s); return r; };  });
async function sample(name,fn,ms){ await p.evaluate(()=>{ window.__t.length=0; window.__f=[]; let last=performance.now(); const tick=()=>{ const n=performance.now(); window.__f.push(n-last); last=n; if(!window.__stop) requestAnimationFrame(tick); }; window.__stop=false; requestAnimationFrame(tick); });
  if(fn) await p.evaluate(fn); await p.waitForTimeout(ms);
  const r=await p.evaluate(()=>{ window.__stop=true; const a=window.__t.slice(), f=window.__f.slice(2); const avg=x=>x.reduce((s,v)=>s+v,0)/Math.max(1,x.length); const pct=(x,q)=>x.slice().sort((a,b)=>a-b)[Math.floor(x.length*q)]||0; return {loopAvg:avg(a),loopP95:pct(a,.95),frameAvg:avg(f),fps:1000/avg(f),n:a.length}; });
  console.log(name.padEnd(14),'loop avg',r.loopAvg.toFixed(1),'ms  p95',r.loopP95.toFixed(1),'ms  frame avg',r.frameAvg.toFixed(1),'ms  =',r.fps.toFixed(0),'fps'); }
console.log('CPU throttle',rate+'x, 390x844 @3x');
await sample('idle',null,3000);
await sample('fire+water fx',()=>{ game.spawnFx(1); game.spawnFx(3,100); },1400);
await sample('rocks+slash',()=>{ game.spawnFx(4); game.spawnFx(0,150); },1400);
await sample('spell meteor',()=>{ for(const t of MANA_TYPES) game.p.mana[t]=12; game.cast(7); },1500);
await sample('gameplay',async()=>{ const m=game.moves()[0]; game.playerMove(m.a,m.b); },3000);
await b.close();})();
