# Page Tree Desktop 31.4.5 — 页面树定制版

包含工具栏首位的“项目页面”按钮，以及独立的左侧多级页面树。

## 选择安装包

- Mac Apple 芯片（M1/M2/M3/M4 等）：Page-Tree-Desktop-31.4.5-mac-arm64.dmg
- Mac Intel 芯片：Page-Tree-Desktop-31.4.5-mac-intel.dmg
- Windows 64 位（Intel / AMD）：Page-Tree-Desktop-31.4.5-windows-x64-setup.exe

## 安装与使用

Mac：打开 DMG，将 Page Tree Desktop 拖到 Applications（应用程序），再启动。
Windows：双击 EXE，按安装向导操作，默认安装到当前用户。

打开原有 .drawio 文件后，点击工具栏最左侧的树形图标展开页面树。
既有文件首次使用时需要设置父子关系；保存后层级随文件保存。
应用名称、图标和标识与官方版区分，自动更新已关闭，后续升级需要重新打包。

## 个人构建提示

这些安装包是自用定制版，不是 draw.io 官方发布版本。
Mac 使用本机临时签名，未做 Apple 开发者签名及公证；Windows 未做发布者签名。
因此跨机器下载、安装时，Gatekeeper 或 SmartScreen 可能提示未知开发者。
仅在确认包来自本次构建且校验值匹配后，通过系统提供的“仍要打开”等入口处理。
SHA256SUMS.txt 提供文件完整性校验值。

## 验证范围

- 桌面版原有 158 项测试通过。
- 三个应用包均包含与网页源码一致的页面树实现，自动更新处于关闭状态。
- 两个 Mac 应用的临时签名完整性、两个 DMG 的镜像校验均通过。
- Mac 打包应用已启动并验证页面树、页面切换、子页新增、撤销、层级序列化。
- Intel Mac 包在 Apple 芯片 Mac 上通过 Rosetta 验证，不等于 Intel 实机测试。
- Windows EXE 已成功构建并核对包内容，尚未进行 Windows 实机安装和运行验证。

源码构建方式见 [桌面构建说明](../packaging/README.md)。
