const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/main/webapp/js/bootstrap.js','utf8');
const start=source.indexOf('        function loadAppJS()');
const end=source.indexOf('        if (!supportedDomain || mxIsElectron)',start);
function setup(desktop,windowLoaded) {
 const pending=new Map();const starts=[];
 const c={mxIsElectron:desktop,supportedDomain:false,mxScriptsLoaded:false,mxWinLoaded:windowLoaded,
  mxscript:(name,callback)=>pending.set(name,callback),
  checkAllLoaded:()=>{if(c.mxScriptsLoaded&&c.mxWinLoaded)starts.push([...pending.keys()])}};
 vm.runInNewContext(source.slice(start,end)+';loadAppJS();',c);
 return {c,pending,starts,finish(name){assert.ok(pending.has(name),name);const fn=pending.get(name);pending.delete(name);if(fn)fn()}};
}
for(const early of [true,false])test('desktop waits for close/save handlers, window loaded early='+early,()=>{
 const s=setup(true,early);s.finish('js/app.min.js');s.c.mxWinLoaded=true;s.c.checkAllLoaded();
 assert.equal(s.starts.length,0,'must not start before desktop overrides');
 for(const f of ['js/diagramly/DesktopLibrary.js','js/diagramly/ElectronApp.js','js/extensions.min.js','js/stencils.min.js','js/shapes-14-6-5.min.js','js/plantuml/drawio-plantuml.min.js']){s.finish(f);assert.equal(s.starts.length,0)}
 s.finish('js/PostConfig.js');assert.equal(s.starts.length,1);
});
test('web startup does not wait for desktop files',()=>{const s=setup(false,true);s.finish('js/app.min.js');assert.equal(s.starts.length,1);assert.equal(s.pending.has('js/diagramly/ElectronApp.js'),false)});
