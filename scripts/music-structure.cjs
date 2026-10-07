const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html'); await p.waitForTimeout(300);
const res=await p.evaluate(()=>{
  const out=[]; const ev=[];
  const saved={}; for(const k of ['osc','nz','lp','bassNote','kick','snare','hat','tomHit','fm','vib']) saved[k]=Snd[k];
  Snd.osc=function(at,f){ ev.push('o'+Math.round(f)); }; Snd.nz=function(){ ev.push('n'); }; Snd.lp=function(at,f,d,type){ ev.push('l'+Math.round(f)+type[0]); };
  Snd.bassNote=function(T,t,f){ ev.push('b'+Math.round(f)); }; Snd.kick=function(){ ev.push('K'); }; Snd.snare=function(){ ev.push('S'); }; Snd.hat=function(){ ev.push('h'); }; Snd.tomHit=function(){ ev.push('T'); }; Snd.fm=function(at,f){ ev.push('f'+Math.round(f)); }; Snd.vib=function(at,f){ ev.push('v'+Math.round(f)); };
  for(let ti=0;ti<TRACKS.length;ti++){ const T=TRACKS[ti]; const bars=[]; let emptySteps=0;
    for(let bar=0;bar<96;bar++){ ev.length=0; let steps=0; for(let i=0;i<16;i++){ const n0=ev.length; Snd.playStep(T,i,bar,0,.086); if(ev.length===n0) emptySteps++; } bars.push(ev.join(',')); }
    const secSig=[]; for(let s=0;s<12;s++) secSig.push(bars.slice(s*8,s*8+8).join('|'));
    // distinctness: melody/harmony content only (ignore drums), measured on lead+bass notes per section
    const uniqBars=new Set(bars).size, uniqSec=new Set(secSig).size;
    // longest span before the exact same 4-bar chunk repeats
    const chunks=[]; for(let c=0;c<24;c++) chunks.push(bars.slice(c*4,c*4+4).join('|')); const uniq4=new Set(chunks).size;
    out.push([T.n,'bpm',T.bpm,T.sc,T.kit.k+'/'+T.kit.s+'/'+T.kit.h,'bass',T.bt,'lead',T.lf,'bars',96,'unique bars',uniqBars,'unique sections',uniqSec+'/12','unique 4-bar chunks',uniq4+'/24','drums',T.dm.join('/'),'empty steps',emptySteps]); }
  for(const k in saved) Snd[k]=saved[k];
  return out; });
for(const r of res) console.log(r.join(' '));
console.log(errs); await b.close();})();
