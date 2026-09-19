const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
for(const platform of ['mac','win']) {
 test(`${platform} excludes development files and build outputs`,()=>{
  const config=JSON.parse(fs.readFileSync(`packaging/electron-builder-page-tree-${platform}.json`));
  for(const rule of ['!personal-tests{,/**}','!BUILD-PAGE-TREE.md','!**/.DS_Store','!**/*.log','!**/.env{,.*}','!dist{,/**}']) assert.ok(config.files.includes(rule),rule);
  assert.ok(config.files.includes('drawio/src/main/webapp/js/diagramly/SheetTree.js'));
 });
}
