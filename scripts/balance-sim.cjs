const {chromium}=require('playwright');
(async()=>{
const skill=parseFloat(process.argv[2]||'0.7'), runs=parseInt(process.argv[3]||'12'), maxStage=parseInt(process.argv[4]||'22');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ try{ localStorage.clear(); }catch(e){} });
await p.goto('file://'+process.cwd()+'/index.html?fast'); await p.waitForTimeout(300);
const res=await p.evaluate(async([skill,runs,maxStage])=>{
  const stats={}; const wait=()=>new Promise(r=>setTimeout(r,0));
  async function battle(){
    let turns=0; window.__minHp=1;
    while(!game.over && turns<200){ window.__minHp=Math.min(window.__minHp,game.p.hp/game.p.max);
      const p=game.p;
      // healing
      if(p.hp<p.max*.4){ if(game.canCast(1)) { await game.cast(1); continue; } if(p.potions.hp>0&&Math.random()<skill){ game.usePotion("hp"); continue; } }
      // spells: damage priority (casual players cast whatever is ready, sometimes)
      if(Math.random()<skill){
        const order=[7,0,3,4,2,6,5];
        let casted=false;
        for(const i of order){ if(i===3){ let sk=0; for(const row of game.b) for(const g of row) if(g&&g.t===0) sk++; if(sk<5) continue; } if(i===6&&game.p.shield>0) continue; if(i===5&&!(p.poison||p.stunned)) continue; if(game.canCast(i)){ await game.cast(i); casted=true; break; } }
        if(casted) continue;
      }
      if(p.potions.mana>0&&Math.random()<.3*skill){ game.usePotion("mana"); }
      const ms=game.moves(); if(!ms.length) break;
      const sc=m=>m.m.cells.filter(([r,c])=>game.b[r][c].t===0).length*3+Math.max(...m.m.runs.map(x=>x.length))*2+m.m.cells.filter(([r,c])=>[1,2,3,4].includes(game.b[r][c].t)).length*0.7+Math.random()*2;
      ms.sort((x,y)=>sc(y)-sc(x));
      const pick=Math.random()<skill?ms[0]:ms[Math.floor(Math.random()*ms.length)];
      await game.playerMove(pick.a,pick.b); turns++;
      await wait();
    }
    return turns;
  }
  function shop(){
    const g=game, p=g.p; const want=["hp","pot_hp","sp7","sp0","blade","sp1","sp2","sp3","pot_hp","sp6","sp4","sp5"];
    let again=true; while(again){ again=false; for(const id of want){ const it=g.items().find(x=>x.id===id); if(it&&it.ok&&p.gold>=it.cost&&!(id==="pot_hp"&&p.potions.hp>=3)){ g.buy(id); again=true; break; } } }
    closePanel();
  }
  for(let run=0;run<runs;run++){
    try{ localStorage.clear(); }catch(e){}
    game.p.lv=1;game.p.xp=0;game.p.gold=0;game.p.hpUp=0;game.p.blade=0;game.p.spellLv=SPELLS.map(()=>1);game.p.potions={hp:1,mana:0};game.stage=0;Tut.done=false;Tut.hide();game.recalc();
    game.started=true; closePanel(); game.startBattle();
    let attempts=0;
    while(game.stage<maxStage && attempts<60){
      const st=game.stage; const turns=await battle(); const win=game.e.hp<=0; attempts++;
      const S=stats[st]||(stats[st]={n:0,w:0,turns:0,lv:0,hpEnd:0,gold:0}); S.n++; if(win){S.w++;S.turns+=turns;S.lv+=game.p.lv;S.hpEnd+=window.__minHp;S.gold+=game.p.gold;}
      closePanel();
      shop(); game.startBattle();
    }
  }
  return stats;
},[skill,runs,maxStage]);
console.log('skill',skill,'runs',runs);
for(const [st,S] of Object.entries(res)) console.log(String(+st+1).padStart(2),'n',String(S.n).padStart(3),'win%',String(Math.round(100*S.w/S.n)).padStart(3),'turns',S.w?(S.turns/S.w).toFixed(1):'-','lv',S.w?(S.lv/S.w).toFixed(1):'-','minHp',S.w?(S.hpEnd/S.w).toFixed(2):'-','coins',S.w?Math.round(S.gold/S.w):'-');
console.log(errs.slice(0,3)); await b.close();})();
