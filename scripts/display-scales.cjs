const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(e=>null)||await chromium.launch();
for(const [w,h,dsf] of [[1000,640,2],[1366,768,1],[1366,768,1.25],[1280,720,1.5],[1000,640,2.5],[390,844,2],[390,844,3],[1920,1080,1]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:dsf}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.cwd()+'/index.html'); await p.click('[data-act=play]'); await p.waitForTimeout(600);
  // measure where gems are drawn: fraction of canvas pixels (non-transparent) in right half
  const r=await p.evaluate(()=>{ const c=document.getElementById('cv'); const x=c.getContext('2d'); const d=x.getImageData(c.width*.75,c.height*.4,c.width*.2,c.height*.2).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>0) n++; return {px:c.width,scale:game.scale,filledRight:n/(d.length/4)}; });
  console.log(w+'x'+h,'dsf',dsf,JSON.stringify(r),errs.length?errs:'');
  if(dsf===2&&w===1000) await p.screenshot({path:'/dev/null'});
  await ctx.close(); }
await b.close();})();
