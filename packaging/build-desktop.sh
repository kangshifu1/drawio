#!/usr/bin/env bash
set -euo pipefail
platform="${1:-all}"
case "$platform" in mac|win|all) ;; *) echo 'Usage: packaging/build-desktop.sh [mac|win|all]' >&2; exit 1;; esac
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
build_root="$repo_root/build/page-tree-desktop"
desktop_ref=f5cc2222fb9732612739e08d99bb4d3d2078cd44
if [ ! -d "$build_root/.git" ]; then
  git clone --no-checkout https://github.com/jgraph/drawio-desktop.git "$build_root"
fi
# This directory is disposable build output, never the user's desktop checkout.
git -C "$build_root" checkout --detach "$desktop_ref"
mkdir -p "$build_root/drawio/src" "$build_root/build/page-tree"
cp -R "$repo_root/src/." "$build_root/drawio/src/"
cp "$repo_root/VERSION" "$repo_root/LICENSE" "$build_root/drawio/"
cp "$repo_root"/packaging/electron-builder-page-tree-*.json "$build_root/"
cp "$repo_root"/packaging/page-tree/* "$build_root/build/page-tree/"
cd "$build_root"
npm ci --no-audit --no-fund
node --input-type=commonjs <<'JS'
const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));
p.name='page-tree-desktop';p.productName='Page Tree Desktop';p.description='Personal diagram editor with hierarchical project pages';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
JS
npm run sync -- disableUpdate
export DRAWIO_UNSIGNED=true CSC_IDENTITY_AUTO_DISCOVERY=false
if [ "$platform" = mac ] || [ "$platform" = all ]; then
  npx electron-builder --config electron-builder-page-tree-mac.json --mac dmg --arm64 --x64 --publish never
fi
if [ "$platform" = win ] || [ "$platform" = all ]; then
  npx electron-builder --config electron-builder-page-tree-win.json --win nsis --x64 --publish never
fi
