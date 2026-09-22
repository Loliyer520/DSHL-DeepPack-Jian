#!/usr/bin/env bash
# npm 安装会把 @deepseek-ai 运行时装出多份物理副本，而 dsh 的工具调度器用
# Symbol 挂载（Symbol("@deepseek-ai/dsh-tools.scheduler")）——跨副本读就是
# undefined，任何工具执行都崩 "Cannot read properties of undefined (reading 'prepare')"。
# 修法：把所有同版本嵌套副本换成指向 dsh 内嵌树（规范源）的符号链接，强制单实例。
# 每次 npm install 后重跑本脚本（npm 可能重建物理副本）。
set -euo pipefail
ROOT=/my/own/djian/node_modules
CANON=$ROOT/@deepseek-ai/dsh/node_modules/@deepseek-ai
BACKUP=${BACKUP:-/tmp/djian-nested-backup-$(date +%s)}
linked=0
find "$ROOT" -type d -path "*/node_modules/@deepseek-ai" ! -path "$ROOT/@deepseek-ai/dsh/node_modules/*" 2>/dev/null | while read -r scope; do
  for p in "$scope"/*/; do
    p=${p%/}
    name=$(basename "$p")
    [ -L "$p" ] && continue
    [ -e "$CANON/$name" ] || continue
    v1=$(grep -o '"version": "[^"]*"' "$p/package.json" 2>/dev/null | cut -d'"' -f4)
    v2=$(grep -o '"version": "[^"]*"' "$CANON/$name/package.json" 2>/dev/null | cut -d'"' -f4)
    if [ -n "$v1" ] && [ "$v1" = "$v2" ]; then
      bdir="$BACKUP/$(echo "$scope" | tr '/' '_')"
      mkdir -p "$bdir"
      mv "$p" "$bdir/" && ln -s "$CANON/$name" "$p"
      echo "linked: $p"
    fi
  done
done
echo "done. 副本备份在 $BACKUP"
