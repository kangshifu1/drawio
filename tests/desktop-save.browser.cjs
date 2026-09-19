// Run against a packaged app launched with --remote-debugging-port=9342 and a disposable .drawio file.
const {chromium}=require('playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.connectOverCDP('http://127.0.0.1:9342');
 try {
 const p=b.contexts()[0].pages().find(p=>p.url().includes('index.html'));
 await p.waitForSelector('.geSheetTreeToggle');
 await p.evaluate(()=>Draw.loadPlugin(ui=>window.saveTestUi=ui));
 const file=await p.evaluate(()=>saveTestUi.getCurrentFile()?.fileObject?.path);
 assert.ok(file?.includes('/build/save-check/'),'Use a disposable file under build/save-check');
 assert.equal(await p.evaluate(()=>mxIsElectron),true);
 for(let i=1;i<=2;i++) {
  await p.evaluate(i=>new Promise((resolve,reject)=>{
   const ui=saveTestUi;ui.editor.graph.model.execute(new RenamePage(ui,ui.currentPage,'保存测试 '+i));
   ui.saveFile(false,resolve,reject,()=>reject(Error('Save cancelled')));
  }),i);
  assert.ok(fs.readFileSync(file,'utf8').includes('保存测试 '+i));
  assert.equal(await p.evaluate(()=>saveTestUi.getCurrentFile().fileObject.path),file);
 }
 console.log('PASS: packaged desktop opens a path and saves two edits to the same file without a save dialog');
 } finally {await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
