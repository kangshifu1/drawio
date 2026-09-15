# 桌面安装包构建

本目录保存本分支所用的个人版打包配置、独立图标和 Mac 临时签名配置。

- 上游桌面仓库：`jgraph/drawio-desktop`
- 固定桌面提交：`f5cc2222fb9732612739e08d99bb4d3d2078cd44`
- 基础编辑器：Draw.io 31.4.5，本仓库的页面树修改会复制进桌面包。
- 本次构建使用 Electron 44.2.0、electron-builder 26.16.1。

## 重建

需要 Git、Node.js 24+、npm，Mac 包需要在 macOS 上构建。下列脚本在仓库的 `build/page-tree-desktop/` 中准备构建，不发布到 GitHub：

```sh
bash packaging/build-desktop.sh mac  # Mac arm64 + Intel DMG
bash packaging/build-desktop.sh win  # Windows x64 NSIS EXE
```

输出位于 `build/page-tree-desktop/dist/`。Windows 包可以在本次使用的 macOS 工具链中交叉构建；构建通过不等于 Windows 实机验证。网络无法直连 GitHub 时，为构建进程配置可用的 `HTTPS_PROXY`。

## 配置差异

- 名称 `Page Tree Desktop`，应用 ID `local.kangshifu.pagetree`。
- 显式将 `SheetTree.js` 包含到 ASAR（上游默认排除此目录大部分脚本）。
- `sync -- disableUpdate` 关闭官方自动更新；`publish: null` 防止误发布。
- Mac 使用 ad-hoc 签名和专用 entitlement，未做开发者签名、公证或 Quick Look 扩展。
- Windows 默认当前用户安装，不使用官方发布者签名。

源码和上述配方允许重新构建功能等效包；不同工具版本、时间戳和签名会影响二进制哈希。
