// usage: node scripts/shot.cjs out.png [w h] [stage] — screenshot of the game mid-battle (dev helper)
const {chromium}=require('playwright');
(async()=>{const [out,w=1280,h=720,stage=2]=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>null)||await chromium.launch();
const p=await b.newPage({viewport:{width:+w,height:+h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('gemhollow_save_v1',JSON.stringify({v:1,lv:12,xp:20,gold:300,stage:+(new URLSearchParams(location.search).get('st')||0),best:4,hpUp:3,blade:2,spellLv:[3,2,2,2,2,2,2,3],potions:{hp:2,mana:1},tut:true,ach:{},daily:{last:new Date().toISOString().slice(0,10),streak:1},savedAt:1}));});
await p.goto('file://'+process.cwd()+'/index.html?st='+stage);await p.waitForTimeout(1200);
await p.evaluate(()=>{Tut.done=true;Tut.hide();const b=document.querySelector('[data-act=play]');b&&b.click();});await p.waitForTimeout(3600);
await p.evaluate(()=>{for(const t of MANA_TYPES)game.p.mana[t]=7;game.updateUI();});await p.waitForTimeout(500);
await p.screenshot({path:out});console.log(errs);await b.close()})();
