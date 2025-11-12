# sunrise/ui

一个基于 React 19 的轻量组件库，提供 `Button`、`Card`、`Input`（含 `TextArea`、`Search`、`Password`）等基础组件。组件内部使用 TailwindCSS 类名编写，开发体验友好；同时在打包阶段会生成 `dist/styles.css`，确保在未集成 Tailwind 的项目中也能正常显示。

## 开发与构建
- 开发监听：`pnpm --filter sunrise/ui dev`
- 构建产物：`pnpm --filter sunrise/ui build`（输出到 `dist/`，包含 `index.mjs` 与 `styles.css`）
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
- 打包使用 `tsup`，并通过 Tailwind CLI 生成仅包含库所用类的 `styles.css`
- 默认不注入 reset/base，仅生成 `utilities`，避免与宿主项目样式冲突
- 在未集成 Tailwind 的项目中，手动引入样式：`import 'sunrise/ui/styles.css'`