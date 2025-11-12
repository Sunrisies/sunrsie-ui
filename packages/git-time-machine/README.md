# git-time-machine

一个交互式/非交互式的 Git 提交时间修改工具。支持直接输入目标提交哈希与新时间，也支持在终端中选择最近提交并进行修改，提供友好的 UI 输出。

## 安装与开发
- 监听开发：`pnpm --filter git-time-machine dev`
- 构建产物：`pnpm --filter git-time-machine build`（输出到 `dist/`）
- 清理：`pnpm --filter git-time-machine clean`

## 使用
- 交互式模式（默认）：

```bash
pnpm --filter git-time-machine build
node packages/git-time-machine/dist/index.js
```

- 非交互式模式：

```bash
git-time-machine <commit-hash> "YYYY-MM-DD HH:MM:SS"
# 例如：
git-time-machine a1b2c3d4 "2025-10-02 09:20:21"
```

## 示例与说明
- 提示格式参考：`2025-10-02 9:20:21`
- 修改逻辑基于 `git filter-branch --env-filter`，会重写历史，谨慎使用：
  - 建议先在备份分支或临时仓库中操作
  - 变更后需强制推送远端：`git push --force`

## 特性
- 最近提交列表展示（哈希、作者、日期、相对时间、信息）
- 选择提交序号或直接输入哈希
- 日期校验与提示、重试机制
- 标题与状态信息采用 `chalk` 美化输出