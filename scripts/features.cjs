const {chromium}=require('playwright');
const SDK=`window.__sdk={calls:[],ads:[],mode:'ok'};
window.CrazyGames={SDK:{init:async()=>{},game:{loadingStart(){__sdk.calls.push('loadStart')},loadingStop(){__sdk.calls.push('loadStop')},gameplayStart(){__sdk.calls.push('start')},gameplayStop(){__sdk.calls.push('stop')},happytime(){__sdk.calls.push('happy')}},
 data:{store:{},getItem(k){return this.store[k]||null},setItem(k,v){this.store[k]=v}},
 ad:{requestAd(t,cb){__sdk.ads.push(t); cb.adStarted(); setTimeout(()=>{ if(__sdk.mode==='ok') cb.adFinished(); else cb.adError('x'); },40);}}}};`;
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const R={}, errs=[];
const mk=async(pre)=>{ const ctx=await b.newContext({viewport:{width:1280,height:720}}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&!/ERR_TUNNEL|Failed to load/.test(m.text())&&errs.push(m.text()));
  await p.route('**/crazygames-sdk-v3.js',r=>r.fulfill({contentType:'text/javascript',body:SDK})); if(pre) await p.addInitScript(pre); return [ctx,p]; };
const load=async(p,q='?fast')=>{ await p.goto('file://'+process.cwd()+'/index.html'+q); await p.waitForTimeout(700); };

// 1. first visit: straight into battle, hint button, SDK gameplay start after init
let [c,p]=await mk(); await load(p,'');
R.firstVisit=await p.evaluate(()=>({started:game.started,panel:panelOpen(),tip:!$('tip').hidden,calls:__sdk.calls.join(',')}));
await p.click('#hint'); R.hint=await p.evaluate(()=>({hint:!!game.hint,hold:game.hintHold}));
// 2. leave -> pause menu, stop gameplay, mute; return -> unmute, resume keeps menu until Resume
await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
R.leave=await p.evaluate(()=>({paused:PAUSED,panel:panelOpen(),ctx:game.ctx,away:Snd.away,calls:__sdk.calls.slice(-1)[0]}));
await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
R.back=await p.evaluate(()=>({away:Snd.away,stillPaused:PAUSED}));
await p.click('[data-act=resume]'); R.resume=await p.evaluate(()=>({paused:PAUSED,panel:panelOpen(),last:__sdk.calls.slice(-1)[0]}));
// visibilitychange path
await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); });
R.hiddenTab=await p.evaluate(()=>({panel:panelOpen(),away:Snd.away}));
await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}); document.dispatchEvent(new Event('visibilitychange')); });
await p.click('[data-act=resume]');
// 3. rewarded: defeat -> revive; victory -> double coins; failure path grants nothing
await p.evaluate(async()=>{ game.p.hp=1; await game.hurtPlayer(9); game.checkEnd(); }); await p.waitForTimeout(200);
R.defeatBtns=await p.evaluate(()=>[...document.querySelectorAll('#panelbox button')].map(b=>b.dataset.act));
await p.evaluate(()=>{ __sdk.mode='fail'; }); await p.click('[data-act=revive]'); await p.waitForTimeout(150);
R.reviveFail=await p.evaluate(()=>({over:game.over,hp:game.p.hp,ads:__sdk.ads.join(',')}));
await p.evaluate(()=>{ __sdk.mode='ok'; }); await p.click('[data-act=revive]'); await p.waitForTimeout(300);
R.reviveOk=await p.evaluate(()=>({over:game.over,hp:game.p.hp,max:game.p.max,busy:game.busy,turn:game.turn,nulls:game.b.some(r=>r.some(g=>!g)),ads:__sdk.ads.join(','),happy:__sdk.calls.includes('happy')}));
await p.evaluate(async()=>{ game.e.hp=0; game.checkEnd(); }); await p.waitForTimeout(300);
const g0=await p.evaluate(()=>game.p.gold); await p.click('[data-act=double]'); await p.waitForTimeout(200);
R.double=await p.evaluate(g0=>({gold:game.p.gold,g0,again:!!document.querySelector('[data-act=double]'),coinsShown:game.rewards.coins}),g0);
await c.close();
// 4. difficulty
[c,p]=await mk(); await load(p);
R.diff=await p.evaluate(()=>{ const o={}; for(const d of ['easy','normal','hard']){ Settings.diff=d; game.stage=3; game.startBattle(); o[d]=[game.e.max,game.e.atk]; } Settings.diff='normal'; return o; });
// 5. localization
await p.evaluate(()=>{ Settings.lang='es'; Settings.langSet=true; game.applyLang(); });
R.es=await p.evaluate(()=>({spell:$('sp0').textContent.slice(0,40),pname:$('pname').textContent,lv:$('plv').textContent,hintTitle:$('hint').title,tip:T('Got it')}));
R.langIntegrity=await p.evaluate(()=>{ const bad=[]; const ph=s=>(s.match(/\{\w+\}/g)||[]).sort().join(); TR.forEach(r=>{ for(let i=1;i<6;i++){ if(!r[i]||ph(r[i])!==ph(r[0])) bad.push([LANGS[i][0],r[0].slice(0,40)]); } }); return {rows:TR.length,bad}; });
for(const l of ['de','ru','fr','pt']){ await p.evaluate(l=>{ Settings.lang=l; game.applyLang(); game.openMenu(); game.settingsPanel(); game.howtoPanel(); game.shopPanel(); game.achPanel(); closePanel(); },l); }
R.noUndefinedText=await p.evaluate(()=>!/undefined|NaN/.test(document.body.innerText));
await p.evaluate(()=>{ Settings.lang='en'; game.applyLang(); });
// 6. achievements + daily + endless
R.ach=await p.evaluate(async()=>{ closePanel(); game.stage=0; game.startBattle(); game.e.hp=0; game.checkEnd(); await new Promise(r=>setTimeout(r,100)); return {first:!!game.ach.first,flawless:!!game.ach.flawless,toast:$('toast').textContent,saved:!!Store.get(Store.key).ach.first}; });
R.endless=await p.evaluate(async()=>{ closePanel(); game.stage=9; game.startBattle(); game.e.hp=0; game.checkEnd(); await new Promise(r=>setTimeout(r,100)); const t=document.querySelector('#panelbox').innerText; const r={campaign:game.campaign,panelHas:/Campaign complete/.test(t),dragon:!!game.ach.dragon}; closePanel(); game.startBattle(); r.label=$('elv').textContent; return r; });
await c.close();
// daily: save with yesterday's date
[c,p]=await mk(()=>{ const d=new Date(); d.setDate(d.getDate()-1); const y=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); localStorage.setItem('gemhollow_save_v1',JSON.stringify({v:1,lv:3,xp:0,gold:100,stage:2,best:2,hpUp:0,blade:0,spellLv:[1,1,1,1,1,1,1,1],potions:{hp:1,mana:0},tut:true,daily:{last:y,streak:2},savedAt:1})); });
await load(p);
R.homeHas=await p.evaluate(()=>document.querySelector('#panelbox').innerText.slice(0,120).replace(/\n/g,' | '));
await p.click('[data-act=play]'); R.dailyPanel=await p.evaluate(()=>document.querySelector('#panelbox').innerText.replace(/\n/g,' | '));
await p.click('[data-act=claim]'); await p.waitForTimeout(200);
R.dailyClaimed=await p.evaluate(()=>({gold:game.p.gold,potions:game.p.potions.hp,streak:game.daily.streak,started:game.started,panel:panelOpen(),ach:!!game.ach.daily,saved:Store.get(Store.key).daily}));
await p.reload(); await p.waitForTimeout(500); R.noSecondDaily=await p.evaluate(()=>!document.querySelector('[data-act=claim]')&&!!document.querySelector('[data-act=play]'));
await c.close();
// 7. no SDK: rewarded buttons hidden, ad flow still works
const ctx2=await b.newContext({viewport:{width:1280,height:720}}); const p2=await ctx2.newPage(); p2.on('pageerror',e=>errs.push(e.message)); await p2.goto('file://'+process.cwd()+'/index.html?fast'); await p2.waitForTimeout(700);
R.noSdk=await p2.evaluate(async()=>{ game.p.hp=1; await game.hurtPlayer(9); game.checkEnd(); await new Promise(r=>setTimeout(r,100)); return {reviveBtn:!!document.querySelector('[data-act=revive]'),retry:!!document.querySelector('[data-act=retry]')}; });
console.log(JSON.stringify(R,null,1)); console.log('errs',errs); await b.close();})();
