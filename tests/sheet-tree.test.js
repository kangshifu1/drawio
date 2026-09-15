const {test} = require('node:test');
const assert = require('node:assert/strict');
const {buildTree, canMove} = require('../src/main/webapp/js/diagramly/SheetTree.js');
function page(id, parent) { return {getId: () => id, node: {getAttribute: () => parent}}; }
test('nested pages retain order; missing parents remain accessible', () => {
 const pages = [page('a'), page('b','a'), page('c','b'), page('d','missing')];
 const tree = buildTree(pages);
 assert.deepEqual(tree.roots.map(n=>n.page.getId()), ['a','d']);
 assert.equal(tree.nodes.get('b').children[0].page.getId(), 'c');
 assert.equal(canMove(pages,pages[0],'c'),false);
 assert.equal(canMove(pages,pages[1],'b'),false);
 assert.equal(canMove(pages,pages[2],''),true);
 assert.equal(canMove(pages,pages[2],'missing'),false);
});
test('malformed cycles cannot hide pages or hang navigation', () => {
 const pages = [page('a','b'),page('b','a'),page('c','a'),page('d','d')];
 assert.equal(buildTree(pages).roots.length,4);
 assert.equal(canMove(pages,pages[2],'a'),false);
});
test('page identifiers cannot collide with object properties', () => {
 const pages = [page('__proto__'),page('constructor','__proto__')];
 assert.equal(buildTree(pages).roots[0].children.length,1);
});
