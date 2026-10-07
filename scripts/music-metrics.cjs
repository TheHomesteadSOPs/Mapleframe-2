const {chromium}=require('playwright');
(async()=>{
const tr=parseInt(process.argv[2]||'0'), secs=parseInt(process.argv[3]||'25');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--autoplay-policy=no-user-gesture-required']}).catch(e=>null)||await chromium.launch();
const p=await b.newPage({viewport:{width:900,height:700}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html'); await p.click('[data-act=play]'); await p.waitForTimeout(300);
const r=await p.evaluate(async([tr,secs])=>{
  Snd.init(); Snd.setTrackNow(tr); const an=Snd.ctx.createAnalyser(); an.fftSize=2048; Snd.master.connect(an);
  const td=new Float32Array(2048), fd=new Float32Array(1024), rms=[]; let cen=0,low=0,tot=0,n=0; const hz=Snd.ctx.sampleRate/2048;
  const t0=performance.now();
  while(performance.now()-t0<secs*1000){ await new Promise(r=>setTimeout(r,50)); an.getFloatTimeDomainData(td); let s=0; for(const v of td) s+=v*v; rms.push(Math.sqrt(s/2048)); an.getFloatFrequencyData(fd);
    let sw=0,sp=0,sl=0; for(let i=1;i<1024;i++){ const m=Math.pow(10,fd[i]/20); sw+=m*i*hz; sp+=m; if(i*hz<160) sl+=m; } if(sp>1e-6){ cen+=sw/sp; low+=sl/sp; n++; } }
  const sorted=rms.slice().sort((a,b)=>a-b), med=sorted[Math.floor(sorted.length/2)]; let quiet=0; for(let i=0;i+5<rms.length;i++) if(Math.max(...rms.slice(i,i+5))<med*.3) quiet++;
  return {n:TRACKS[tr].n,bpm:TRACKS[tr].bpm,rms:med,centroid:cen/n,lowShare:low/n,quiet}; },[tr,secs]);
console.log(r.n.padEnd(17),'bpm',r.bpm,'rms',r.rms.toFixed(3),'centroid',Math.round(r.centroid)+'Hz','low<160Hz share',(r.lowShare*100).toFixed(0)+'%','quiet windows',r.quiet,errs.length?errs:'');
await b.close();})();
