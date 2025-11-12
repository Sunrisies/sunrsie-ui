# sunrise/ui

一个基于 React 19 的轻量组件库，提供 `Button`、`Card`、`Input`（含 `TextArea`、`Search`、`Password`）等基础组件，支持在 Monorepo 下与示例应用 `react-ui` 协同开发。

## 开发与构建
- 开发监听：`pnpm --filter sunrise/ui dev`
- 构建产物：`pnpm --filter sunrise/ui build`（输出到 `dist/`）
- 代码检查：`pnpm --filter sunrise/ui lint`
- 清理：`pnpm --filter sunrise/ui clean`

## 导出内容
- `Button`、`Card`
- `Input` 及其子组件：`Input.TextArea`、`Input.Search`、`Input.Password`

## 使用示例
在应用中按需引入组件：

```tsx
import { Button, Card, Input } from 'sunrise/ui'

export default function Demo() {
  return (
    <Card title="示例" extra={<a href="#">更多</a>}>
      <Input placeholder="请输入" allowClear />
      <Button type="button">提交</Button>
    </Card>
  )
}
```

## 环境要求
- React/ReactDOM 19.x
- Node.js ≥ 18，建议配合 `pnpm@10`

## 说明
- 打包使用 `tsup`，入口与类型文件输出在 `dist/`
- 组件采用简洁的样式类名（Tailwind 风格），可根据项目需要覆盖或扩展