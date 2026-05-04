#!/bin/bash
# /done 命令 — 自动暂存并提交所有变更
# 使用方式: /done <提交信息>
# 如不提供提交信息，会使用默认信息

set -e

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "没有检测到变更，跳过提交"
  exit 0
fi

# 添加所有变更（不包括 .gitignore 中忽略的文件）
git add -A

# 构建提交信息
if [ $# -ge 1 ]; then
  msg="$*"
else
  msg="chore: 小需求开发完成"
fi

# 检查是否有 staged 变更
if git diff --cached --quiet; then
  echo "没有 staged 变更，跳过提交"
  exit 0
fi

git commit -m "$msg"
echo ""
echo "✓ 已提交: $msg"
