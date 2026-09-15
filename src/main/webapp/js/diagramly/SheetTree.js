/** Local project extension: hierarchical navigation for diagram pages. */
(function(root)
{
	'use strict';
	var attribute = 'sheet-parent';

	// Invalid or missing parents are shown at the root without changing the file.
	function buildTree(pages)
	{
		var nodes = new Map();
		pages.forEach(function(page)
		{
			nodes.set(page.getId(), {page: page, children: [], parent: null});
		});
		nodes.forEach(function(node, id)
		{
			var parent = node.page.node.getAttribute(attribute);
			var seen = new Set([id]);
			var cursor = parent;
			while (nodes.has(cursor) && !seen.has(cursor))
			{
				seen.add(cursor);
				cursor = nodes.get(cursor).page.node.getAttribute(attribute);
			}
			if (nodes.has(parent) && !seen.has(cursor)) node.parent = parent;
		});
		var roots = [];
		nodes.forEach(function(node)
		{
			if (node.parent === null) roots.push(node);
			else nodes.get(node.parent).children.push(node);
		});
		return {nodes: nodes, roots: roots};
	}

	function canMove(pages, page, parentId)
	{
		var byId = new Map(pages.map(function(p) { return [p.getId(), p]; }));
		if (!page || !byId.has(page.getId())) return false;
		if (!parentId) return true;
		if (!byId.has(parentId)) return false;
		var seen = new Set([page.getId()]);
		while (byId.has(parentId))
		{
			if (seen.has(parentId)) return false;
			seen.add(parentId);
			parentId = byId.get(parentId).node.getAttribute(attribute);
		}
		return true;
	}

	function install(ui)
	{
		if (!ui.sidebar || ui.sheetTree || ui.editor.chromeless) return;
		var graph = ui.editor.graph;
		var collapsed = new Set();
		var dragged = null;
		var panel = document.createElement('section');
		panel.className = 'geSheetTree';
		panel.id = 'geProjectPages';
		panel.hidden = true;
		// The palette suppresses mousedown defaults; preserve native controls and drag here.
		panel.addEventListener('mousedown', function(evt) { evt.stopPropagation(); });
		panel.setAttribute('aria-label', '项目页面树');
		var style = document.createElement('style');
		style.textContent = '.geSheetTree{padding:10px 8px;border-bottom:1px solid #aaa;font-size:12px;white-space:normal;box-sizing:border-box;width:100%;overflow:hidden;min-height:0;display:flex;flex-direction:column;gap:0;grid-column:1;grid-row:3;border-right:1px solid #aaa}' +
			'.geSheetTree[hidden]{display:none}' +
			'.geEditor.geSheetTreeOpen{grid-template-columns:clamp(210px,22vw,270px) min-content min-content 1fr min-content}' +
			'.geEditor>.geSheetTreePalette{grid-column:1 / 3;grid-row:3;display:grid;grid-template-columns:min-content min-content;min-height:0;position:relative}' +
			'.geSheetTreePalette>.geSidebarContainer{grid-column:1;grid-row:1;min-height:0}' +
			'.geSheetTreePalette>.geHsplit{grid-column:2;grid-row:1;z-index:2}' +
			'.geEditor.geSheetTreeOpen>.geSheetTreePalette{grid-column:2 / 4}' +
			'.geEditor.geSheetTreeOpen>.geDiagramContainer{grid-column:4}' +
			'.geEditor.geSheetTreeOpen>.geFormatContainer{grid-column:5}' +
			'.geSheetTreeToggle{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;width:30px;height:28px;padding:5px;margin-right:5px;border:0;border-radius:4px;color:inherit;background:transparent;cursor:pointer}' +
			'.geSheetTreeToggle:hover,.geSheetTreeToggle[aria-expanded="true"]{background:rgba(40,125,220,.18)}' +
			'.geSheetTree header,.geSheetTree>input,.geSheetTreeTools,.geSheetTree>label,.geSheetTreeHint{flex-shrink:0}' +
			'.geSheetTree label{display:block}.geSheetTree select{display:block;margin-top:4px;max-width:100%}' +
			'.geSheetTree header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}' +
			'.geSheetTree button,.geSheetTree input,.geSheetTree select{font:inherit;color:inherit;box-sizing:border-box}' +
			'.geSheetTree button{cursor:pointer;background:transparent;border:1px solid #aaa;border-radius:4px;padding:4px}' +
			'.geSheetTree button:disabled{opacity:.4;cursor:default}' +
			'.geSheetTree input,.geSheetTree select{width:100%;padding:5px;background:transparent;border:1px solid #aaa;border-radius:4px}' +
			'.geSheetTreeList{flex:1;min-height:40px;overflow:auto;margin:7px 0}' +
			'.geSheetTreeRow{display:flex;align-items:center;min-height:29px;border-radius:4px}' +
			'.geSheetTreeRow[aria-current="page"]{background:rgba(40,125,220,.22);font-weight:bold}' +
			'.geSheetTreeRow button{border:0;text-align:left}' +
			'.geSheetTreeRow .geSheetTreeName{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
			'.geSheetTreeRow .geSheetTreeFold{width:23px;flex-shrink:0}' +
			'.geSheetTreeTools{display:flex;gap:4px;margin-bottom:7px;flex-wrap:wrap}' +
			'.geSheetTreeHint{opacity:.65;font-size:11px;margin-top:6px;line-height:1.5}';
		document.head.appendChild(style);
		var header = document.createElement('header');
		var title = document.createElement('strong');
		title.textContent = '项目页面';
		header.appendChild(title);
		panel.appendChild(header);
		function button(label, parent, action)
		{
			var b = document.createElement('button');
			b.type = 'button'; b.textContent = label;
			b.addEventListener('click', action); parent.appendChild(b); return b;
		}
		var headerActions = document.createElement('div');
		header.appendChild(headerActions);
		button('展开全部', headerActions, function() { collapsed.clear(); render(); });
		var close = button('×', headerActions, function() { setOpen(false); toggle.focus(); });
		close.setAttribute('aria-label', '关闭项目页面');
		close.title = '关闭项目页面';
		close.style.marginLeft = '5px';
		var search = document.createElement('input');
		search.type = 'search'; search.placeholder = '搜索页面…';
		search.setAttribute('aria-label', '搜索页面'); panel.appendChild(search);
		var list = document.createElement('div');
		list.className = 'geSheetTreeList'; list.setAttribute('role', 'tree');
		list.setAttribute('aria-label', '页面层级'); panel.appendChild(list);
		var tools = document.createElement('div'); tools.className = 'geSheetTreeTools'; panel.appendChild(tools);
		var add = button('+ 页面', tools, function() { ui.insertPage(); });
		var child = button('+ 子页面', tools, function()
		{
			var parent = ui.currentPage;
			if (!parent || !editable()) return;
			graph.model.beginUpdate();
			try
			{
				var page = ui.createPage(null, ui.createPageId());
				page.node.setAttribute(attribute, parent.getId());
				ui.insertPage(page); collapsed.delete(parent.getId());
			}
			finally { graph.model.endUpdate(); }
		});
		var rename = button('重命名', tools, function() { if (ui.currentPage) ui.renamePage(ui.currentPage); });
		var label = document.createElement('label'); label.textContent = '当前页的上级'; panel.appendChild(label);
		var select = document.createElement('select'); select.setAttribute('aria-label', '当前页的上级');
		label.appendChild(select);
		var hint = document.createElement('div'); hint.className = 'geSheetTreeHint';
		hint.textContent = '拖动页面到另一页下可设为子级。层级随文件保存。'; panel.appendChild(hint);
		// Keep the palette and its splitter in their own coordinate system so the
		// native splitter continues to measure palette width when the drawer opens.
		var palette = document.createElement('div');
		palette.className = 'geSheetTreePalette';
		ui.container.insertBefore(palette, ui.sidebarContainer);
		palette.appendChild(ui.sidebarContainer);
		palette.appendChild(ui.hsplit);
		ui.container.appendChild(panel);
		var toggle = document.createElement('button');
		toggle.type = 'button'; toggle.className = 'geSheetTreeToggle';
		toggle.title = '项目页面'; toggle.setAttribute('aria-label', '项目页面');
		toggle.setAttribute('aria-controls', panel.id);
		toggle.setAttribute('aria-expanded', 'false');
		toggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="5" rx="1"/><path d="M6.5 8v11h7M6.5 12h7"/><rect x="14" y="9.5" width="7" height="5" rx="1"/><rect x="14" y="16.5" width="7" height="5" rx="1"/></svg>';
		// Outside the toolbar's replaceable contents, including text-edit mode.
		ui.toolbarContainer.insertBefore(toggle, ui.toolbarContainer.firstChild);
		toggle.addEventListener('click', function() { setOpen(panel.hidden); });
		panel.addEventListener('keydown', function(evt)
		{
			if (evt.key === 'Escape') { setOpen(false); toggle.focus(); evt.stopPropagation(); }
		});
		function setOpen(open)
		{
			panel.hidden = !open;
			ui.container.classList.toggle('geSheetTreeOpen', open);
			toggle.setAttribute('aria-expanded', String(open));
			ui.refresh(true);
			if (open) reveal();
		}
		function editable() { return graph.isEnabled() && ui.pages != null; }
		function ParentChange(page, parent)
		{
			this.page = page; this.previous = parent;
		}
		ParentChange.prototype.execute = function()
		{
			var old = this.page.node.getAttribute(attribute);
			if (this.previous) this.page.node.setAttribute(attribute, this.previous);
			else this.page.node.removeAttribute(attribute);
			this.previous = old;
			ui.editor.fireEvent(new mxEventObject('sheetTreeChanged'));
		};
		function move(page, parent)
		{
			if (!editable() || !canMove(ui.pages, page, parent)) return false;
			if ((page.node.getAttribute(attribute) || '') === (parent || '')) return true;
			graph.stopEditing(false);
			graph.model.execute(new ParentChange(page, parent));
			collapsed.delete(parent); render(); return true;
		}
		select.addEventListener('change', function() { move(ui.currentPage, select.value); });
		search.addEventListener('input', render);
		function render()
		{
			var pages = ui.pages || [];
			var tree = buildTree(pages);
			var query = search.value.trim().toLocaleLowerCase();
			var visible = new Set();
			tree.nodes.forEach(function(node, id)
			{
				if (!query || (node.page.getName() || '').toLocaleLowerCase().indexOf(query) >= 0)
				{
					var cursor = node;
					while (cursor) { visible.add(cursor.page.getId()); cursor = tree.nodes.get(cursor.parent); }
				}
			});
			title.textContent = '项目页面 · ' + pages.length;
			list.replaceChildren();
			function row(node, depth)
			{
				var page = node.page, id = page.getId();
				if (!visible.has(id)) return;
				var item = document.createElement('div'); item.className = 'geSheetTreeRow';
				item.dataset.pageId = id; item.setAttribute('role', 'treeitem');
				item.setAttribute('aria-level', depth + 1);
				item.setAttribute('aria-selected', page === ui.currentPage ? 'true' : 'false');
				if (page === ui.currentPage) item.setAttribute('aria-current', 'page');
				item.style.paddingLeft = depth * 14 + 'px';
				var closed = collapsed.has(id) && !query;
				if (node.children.length) item.setAttribute('aria-expanded', String(!closed));
				var fold = button(node.children.length ? (closed ? '▸' : '▾') : '·', item, function()
				{
					if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id); render();
				});
				fold.className = 'geSheetTreeFold'; fold.disabled = !node.children.length;
				fold.setAttribute('aria-label', (closed ? '展开 ' : '折叠 ') + page.getName());
				var name = button(page.getName() || '未命名页面', item, function() { ui.selectPage(page); });
				name.className = 'geSheetTreeName'; name.title = page.getName();
				item.draggable = editable();
				item.addEventListener('dragstart', function(evt)
				{
					dragged = page; evt.dataTransfer.setData('text/plain', id); evt.dataTransfer.effectAllowed = 'move';
					evt.stopPropagation();
				});
				item.addEventListener('dragend', function() { dragged = null; });
				item.addEventListener('dragover', function(evt)
				{
					if (dragged && canMove(pages, dragged, id)) { evt.preventDefault(); evt.stopPropagation(); }
				});
				item.addEventListener('drop', function(evt)
				{
					if (dragged) { evt.preventDefault(); evt.stopPropagation(); move(dragged, id); dragged = null; }
				});
				list.appendChild(item);
				if (!closed) node.children.forEach(function(n) { row(n, depth + 1); });
			}
			tree.roots.forEach(function(n) { row(n, 0); });
			if (!list.childNodes.length) list.textContent = pages.length ? '没有匹配的页面' : '打开或新建文件以管理页面';
			select.replaceChildren();
			var option = document.createElement('option'); option.value = ''; option.textContent = '（顶级页面）'; select.appendChild(option);
			pages.forEach(function(p)
			{
				if (canMove(pages, ui.currentPage, p.getId()))
				{
					var o = document.createElement('option'); o.value = p.getId(); o.textContent = p.getName(); select.appendChild(o);
				}
			});
			var current = ui.currentPage && tree.nodes.get(ui.currentPage.getId());
			select.value = current && current.parent || '';
			add.disabled = !editable(); child.disabled = rename.disabled = select.disabled = !editable() || !current;
		}
		function reveal()
		{
			var tree = buildTree(ui.pages || []);
			var node = ui.currentPage && tree.nodes.get(ui.currentPage.getId());
			while (node) { collapsed.delete(node.parent); node = tree.nodes.get(node.parent); }
			render();
			var active = list.querySelector('[aria-current="page"]');
			if (active) active.scrollIntoView({block: 'nearest'});
		}
		['pageRenamed', 'pageMoved', 'pagesPatched', 'sheetTreeChanged'].forEach(function(event)
		{ ui.editor.addListener(event, render); });
		ui.editor.addListener('pageSelected', reveal);
		ui.editor.addListener('fileLoaded', function() { collapsed.clear(); search.value = ''; dragged = null; render(); });
		graph.model.addListener(mxEvent.CHANGE, render);
		ui.sheetTree = {render: render, move: move, panel: panel, setOpen: setOpen};
		render();
	}
	root.installSheetTree = install;
	if (typeof module !== 'undefined') module.exports = {buildTree: buildTree, canMove: canMove};
})(typeof window !== 'undefined' ? window : globalThis);
