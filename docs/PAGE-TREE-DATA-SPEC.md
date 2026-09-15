# 页面树数据结构规范 v1.0

适用版本：Page Tree Desktop `v31.4.5-page-tree.1`（基于 Draw.io 31.4.5）。

本规范对应当前实现，不需要新增插件或修改程序。其他工具应输出 `.drawio` XML 文件。树形关系保存在每个页面的 `sheet-parent` 属性中。

## 1. 文件结构

```xml
<mxfile>
  <diagram id="page-project" name="项目总览">
    <!-- 此处为本页 mxGraphModel -->
  </diagram>
  <diagram id="page-production" name="生产管理" sheet-parent="page-project">
    <!-- 此处为本页 mxGraphModel -->
  </diagram>
</mxfile>
```

**所有 `diagram` 必须平铺，作为同一个 `mxfile` 的直接子节点。不要嵌套 `diagram`。**

每个 `diagram` 表示一个真实的 sheet。`sheet-parent` 引用父 sheet 的 `id`，不是页面名称，也不是图形节点 ID。

## 2. 页面字段

| 位置 | 字段 | 类型 | 生成要求 | 含义 |
| --- | --- | --- | --- | --- |
| `diagram` 属性 | `id` | 非空字符串 | 必填、文件内唯一 | 页面永久标识；建议 UUID 或 `page-xxx` |
| `diagram` 属性 | `name` | 非空字符串 | 必填 | 页面标题，可中文；允许重名，但建议同级标题不同 |
| `diagram` 属性 | `sheet-parent` | 字符串 | 子页必填，顶级页省略 | 同文件中父页面的 `id` |
| `diagram` 内容 | `mxGraphModel` | XML 元素 | 本规范的未压缩输出必填 | 本页图形内容；允许空画布 |

“必填”是本规范对生成工具的约束，避免依赖编辑器自动修复。编辑器本身可能补齐部分缺失字段。

属性名称区分大小写，只识别 **`sheet-parent`**。不要写成 `parentId`、`parent`、`sheetParent`，也不要放在 `mxfile`、`mxGraphModel` 或 `mxCell` 上。

## 3. 层级与排序约束

1. 同一文件内页面 ID 必须唯一且稳定。重命名、移动页面或调整图形时保留原 ID。
2. `sheet-parent` 必须指向同一文件内存在的页面；禁止跨文件引用。
3. 禁止页面指向自己；禁止直接或间接循环，例如 A → B → A。
4. 顶级页面不写 `sheet-parent`，不要写 `"null"`、`"undefined"`、`"root"` 等占位字符串。
5. 一个页面最多有一个父页面；可以有多个子页面，文件可以有多个顶级页面。
6. 同级顺序由 `diagram` 在 XML 中的出现顺序决定，底部标签顺序也是 XML 顺序。
7. 推荐按先父后子的深度优先顺序输出：项目总览、生产管理、生产计划、二道检、质量管理。程序不要求父节点必须先出现。
8. 当前版本不读取 `order`、`sort`、`level`、`path`、`children` 等自定义树字段。
9. 每个树节点都是实际页面；不支持仅用于分组、没有 sheet 的目录节点。需要分组时，创建“模块总览”页面作为父节点。
10. 折叠状态、搜索词不随文件保存；不需要生成这些字段。

当前程序会将无效父级或存在循环祖先链的页面显示在顶级以避免页面失联，这是容错行为，不应依赖它生成文件。

## 4. 完整可用示例

对应树：

```text
项目总览
├── 生产管理
│   ├── 生产计划
│   └── 二道检
└── 质量管理
```

保存以下内容为 UTF-8 编码的 `project.drawio` 即可打开。示例创建五个空白页面；后续可在各页面的 `mxGraphModel` 中添加图形。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram id="page-project" name="项目总览">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
  <diagram id="page-production" name="生产管理" sheet-parent="page-project">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
  <diagram id="page-plan" name="生产计划" sheet-parent="page-production">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
  <diagram id="page-inspection" name="二道检" sheet-parent="page-production">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
  <diagram id="page-quality" name="质量管理" sheet-parent="page-project">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## 5. 页面层级与图形层级的区别

```xml
<diagram id="page-plan" name="生产计划" sheet-parent="page-production">
  <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="task-1" value="下达计划" vertex="1" parent="1">
        <mxGeometry x="120" y="80" width="120" height="60" as="geometry"/>
      </mxCell>
    </root>
  </mxGraphModel>
</diagram>
```

- `diagram@sheet-parent`：页面之间的上下级。
- `mxCell@parent`：同一页面内部的图形容器／图层关系，与页面树无关。
- 不同页面的 `mxCell` 可以重复使用 `0`、`1` 等 ID；页面 `diagram@id` 则必须在整个文件内唯一。

## 6. 修改已有文件

- 保留全部页面、现有页面 ID、图形 XML、连接线、样式和其他属性。
- 仅修改需要调整的 `diagram@sheet-parent`；重命名只修改 `name`。
- 调整同级排序时移动整个 `diagram` 元素，保留其完整内容。
- 如果已有 `diagram` 的内容是压缩文本，调整页面层级无需解压重压：保留文本原样，只修改外层属性即可。
- 新建文件建议使用上述未压缩 XML，减少压缩格式处理错误。不要将未压缩 `mxGraphModel` 转义为普通文本放入 `diagram`。
- XML 属性需要正确转义，例如标题 `计划 & 执行` 应写成 `name="计划 &amp; 执行"`。
- 删除父页时，生成工具应明确将其直接子页改挂到其他页面，或者删除它们的 `sheet-parent` 使其成为顶级页；不要留下悬空引用。

## 7. 可选 JSON 中间格式

如果其他工具习惯生成 JSON，可先用如下中间结构规划页面，再转换为第 4 节的 XML。

**当前应用不直接导入这个 JSON。`schemaVersion`、`pages` 和 `parentId` 是工具间交换约定，不是编辑器已实现的导入 API。**

```json
{
  "schemaVersion": "page-tree-plan/1.0",
  "pages": [
    { "id": "page-project", "name": "项目总览", "parentId": null },
    { "id": "page-production", "name": "生产管理", "parentId": "page-project" },
    { "id": "page-plan", "name": "生产计划", "parentId": "page-production" },
    { "id": "page-inspection", "name": "二道检", "parentId": "page-production" },
    { "id": "page-quality", "name": "质量管理", "parentId": "page-project" }
  ]
}
```

映射规则：数组每项输出一个 `diagram`；`id`、`name` 映射同名 XML 属性；非空 `parentId` 映射为 `sheet-parent`；`null` 时省略该属性。数组顺序保留为 XML 顺序。每项都生成空白或带实际内容的 `mxGraphModel`。

## 8. 可直接发给其他 AI／工具的指令

> 请生成兼容 Page Tree Desktop 页面树增强版的 `.drawio` 文件，使用 UTF-8 未压缩 XML。根元素为 mxfile，各页面 diagram 必须平铺为 mxfile 的直接子节点，不嵌套 diagram。每个 diagram 必须有文件内唯一、稳定的 id 和非空 name。子页面使用 sheet-parent 属性引用父页面 id，顶级页面省略此属性。禁止重复页面 ID、悬空父级、自引用及循环。按先父后子的深度优先顺序输出，同级按预期展示顺序排列。每个树节点都必须对应真实页面；分组请创建模块总览页。每页包含有效 mxGraphModel，空页至少包含 root 下的 mxCell id="0" 与 mxCell id="1" parent="0"。不要用 mxCell 的 parent 表示页面父级，不要使用 children、level 或 order 代替 sheet-parent。如果修改已有图纸，保留原页面 ID 和图形内容，只调整必要的页面属性。最终交付可直接打开的 .drawio 文件。
