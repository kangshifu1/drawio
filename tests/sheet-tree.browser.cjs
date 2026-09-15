const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(() => {
  let install;
  Object.defineProperty(window,'installSheetTree', {configurable:true,
   get:()=>install, set:fn=>{install=function(ui){window.testUi=ui; return fn(ui);};}});
 });
 await page.goto('http://127.0.0.1:8765/?ui=kennedy&lang=zh&mode=device&splash=0&gapi=0&db=0&od=0&tr=0&gh=0', {waitUntil:'load'});
 await page.waitForFunction(()=>window.testUi?.sheetTree,{timeout:60000});
 console.log('editor loaded');
 assert.equal(await page.locator('.geSheetTree').isVisible(), false);
 await page.getByRole('button',{name:'项目页面',exact:true}).click();
 assert.equal(await page.locator('.geSheetTree').isVisible(), true);
 assert.equal(await page.evaluate(()=>testUi.sidebarContainer.contains(testUi.sheetTree.panel)), false);
 assert.equal(await page.evaluate(()=>testUi.toolbarContainer.firstElementChild.className), 'geSheetTreeToggle');

 await page.evaluate(()=>{
  const xml='<mxfile><diagram id="root" name="MES 总览"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram><diagram id="planning" name="生产计划" sheet-parent="root"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram><diagram id="inspection" name="二道检" sheet-parent="planning"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';
  testUi.fileLoaded(new LocalFile(testUi,xml,'页面树演示.drawio'));
 });
 await page.locator('.geSheetTreeName',{hasText:'二道检'}).click();
 assert.equal(await page.evaluate(()=>testUi.currentPage.getId()),'inspection');
 await page.getByLabel('当前页的上级',{exact:true}).selectOption('root');
 assert.equal(await page.evaluate(()=>testUi.currentPage.node.getAttribute('sheet-parent')),'root');
 await page.evaluate(()=>testUi.actions.get('undo').funct());
 assert.equal(await page.evaluate(()=>testUi.currentPage.node.getAttribute('sheet-parent')),'planning');
 await page.evaluate(()=>testUi.actions.get('redo').funct());
 assert.equal(await page.evaluate(()=>testUi.currentPage.node.getAttribute('sheet-parent')),'root');
 assert.equal(await page.evaluate(()=>testUi.getCurrentFile().isModified()),true);
 await page.evaluate(()=>{
  window.savedTree=testUi.getFileData(true);
  testUi.fileLoaded(new LocalFile(testUi,savedTree,'页面树演示.drawio'));
 });
 assert.equal(await page.evaluate(()=>testUi.pages[2].node.getAttribute('sheet-parent')),'root');
 await page.getByRole('button',{name:'折叠 MES 总览',exact:true}).click();
 assert.equal(await page.locator('.geSheetTreeRow').count(),1);
 await page.getByLabel('搜索页面',{exact:true}).fill('二道');
 assert.equal(await page.locator('.geSheetTreeRow').count(),2);
 await page.getByLabel('搜索页面',{exact:true}).fill('');
 await page.getByRole('button',{name:'展开全部',exact:true}).click();
 await page.locator('.geSheetTreeName',{hasText:'生产计划'}).click();
 await page.getByRole('button',{name:'+ 子页面',exact:true}).click();
 assert.equal(await page.evaluate(()=>testUi.pages.length),4);
 assert.equal(await page.evaluate(()=>testUi.currentPage.node.getAttribute('sheet-parent')),'planning');
 await page.evaluate(()=>testUi.actions.get('undo').funct());
 assert.equal(await page.evaluate(()=>testUi.pages.length),3);
 await page.evaluate(()=>testUi.actions.get('redo').funct());
 assert.equal(await page.evaluate(()=>testUi.pages.length),4);
 await page.evaluate(()=>testUi.editor.graph.model.execute(new RenamePage(testUi,testUi.currentPage,'首件确认')));

 await page.locator('[data-page-id="inspection"]').dragTo(page.locator('[data-page-id="planning"]'));
 assert.equal(await page.evaluate(()=>testUi.pages.find(p=>p.getId()==='inspection').node.getAttribute('sheet-parent')),'planning');
 assert.equal(await page.evaluate(()=>testUi.sheetTree.move(testUi.pages[0],'inspection')),false);
 await page.evaluate(()=>testUi.removePage(testUi.pages.find(p=>p.getId()==='planning')));
 assert.equal(await page.locator('[data-page-id="inspection"]').getAttribute('aria-level'),'1');
 await page.evaluate(()=>testUi.actions.get('undo').funct());
 assert.equal(await page.locator('[data-page-id="inspection"]').getAttribute('aria-level'),'3');
 await page.evaluate(()=>testUi.editor.graph.setEnabled(false));
 assert.equal(await page.evaluate(()=>testUi.sheetTree.move(testUi.pages[2],'')),false);
 await page.evaluate(()=>{testUi.editor.graph.setEnabled(true);testUi.sheetTree.render();});

 await page.setViewportSize({width:1090,height:678});
 const bounds = await page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,right:r.right,bottom:r.bottom};};
  return {tree:box(testUi.sheetTree.panel),palette:box(testUi.sidebarContainer),canvas:box(testUi.diagramContainer),toolbar:box(testUi.toolbarContainer)};
 });
 assert.equal(bounds.tree.x,0);
 assert.ok(bounds.palette.x >= bounds.tree.right - 1);
 assert.ok(bounds.canvas.x >= bounds.palette.right - 1);
 assert.ok(bounds.tree.y >= bounds.toolbar.bottom - 1);
 const split = await page.locator('.geHsplit').boundingBox();
 const oldWidth = await page.evaluate(()=>testUi.hsplitPosition);
 await page.mouse.move(split.x+split.width/2,split.y+50);
 await page.mouse.down(); await page.mouse.move(split.x+split.width/2+30,split.y+50,{steps:5}); await page.mouse.up();
 assert.ok(Math.abs(await page.evaluate(()=>testUi.hsplitPosition)-oldWidth-30)<3);
 await page.getByRole('button',{name:'关闭项目页面',exact:true}).click();
 assert.equal(await page.locator('.geSheetTree').isVisible(),false);
 assert.equal(await page.evaluate(()=>testUi.sidebarContainer.getBoundingClientRect().x),0);
 await page.getByRole('button',{name:'项目页面',exact:true}).click();
 await page.getByLabel('搜索页面',{exact:true}).press('Escape');
 assert.equal(await page.locator('.geSheetTree').isVisible(),false);
 await page.getByRole('button',{name:'项目页面',exact:true}).click();
 await page.screenshot({path:'tests/sheet-tree-preview.png'});
 console.log(JSON.stringify({status:'PASS',checks:['navigation','reparent','undo/redo','dirty flag','save/reopen','collapse/search','create child undo/redo','rename','drag/drop','cycle rejection','delete parent/undo','read-only','toolbar toggle','independent panel layout at 1090x678','palette resizing','close/Escape'],pageErrors:errors}));
 assert.deepEqual(errors,[]);
 await browser.close();
})().catch(e=>{console.error(e); process.exit(1);});
