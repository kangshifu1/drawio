const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
for(const name of ['bootstrap','export','vsdxImporter']) {
 const text=fs.readFileSync(`src/main/webapp/js/${name}.js`,'utf8');
 const expression=text.match(/var mxIsElectron = [\s\S]*?;/)[0];
 for(const [ua,expected] of [['Browser draw.io/31 Electron/44',true],['Browser PageTreeDesktop/31 Electron/44',true],['Browser PageTreeDesktop/31',false],['Browser Electron/44',false]])
 test(`${name}: ${ua}`,()=>{const c={navigator:{userAgent:ua}};vm.runInNewContext(expression,c);assert.equal(c.mxIsElectron,expected)});
}
