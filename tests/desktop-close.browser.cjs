// Launch a disposable packaged-app profile with port 9342 and a saved file under build/save-check.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9342');
 try {
 const page=browser.contexts()[0].pages().find(p=>p.url().includes('index.html'));
 await page.waitForSelector('.geSheetTreeToggle');
 await page.evaluate(()=>Draw.loadPlugin(ui=>window.closeTestUi=ui));
 const state=await page.evaluate(()=>({path:closeTestUi.getCurrentFile()?.fileObject?.path,modified:closeTestUi.getCurrentFile()?.isModified()}));
 assert.ok(state.path?.includes('/build/save-check/'),'Only close the disposable test window');
 assert.equal(state.modified,false,'Save all test edits before testing close');
 await page.bringToFront();
 const closed=page.waitForEvent('close',{timeout:10000});
 await page.evaluate(()=>{electron.request({action:'windowAction',method:'close'},()=>{},()=>{})}).catch(()=>{});
 await closed;console.log('PASS native window close for saved document');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
