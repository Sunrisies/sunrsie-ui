# typedoc-vitepress-plugin

一个用于将 Typedoc 输出渲染为 VitePress 页面结构的插件。提供选项声明、前置数据生成与侧边栏生成，帮助在文档站点中集成 API 文档。

## 开发
- 监听开发：`pnpm --filter typedoc-vitepress-plugin dev`
- 清理：`pnpm --filter typedoc-vitepress-plugin clean`

## 使用
在 Typedoc 中加载插件并配置输出：

```bash
npx typedoc \
  --plugin typedoc-vitepress-plugin \
  --vitepressOutput ./docs/.vitepress/api \
  --vitepressBaseUrl / \
  --vitepressTitle "API Documentation" \
  --vitepressDescription "Auto-generated API documentation"
```

或在 `typedoc.json` 中声明：

```json
{
  "plugin": ["typedoc-vitepress-plugin"],
  "vitepressOutput": "./docs/.vitepress/api",
  "vitepressBaseUrl": "/",
  "vitepressTitle": "API Documentation",
  "vitepressDescription": "Auto-generated API documentation"
}
```

## 导出
- `VitePressRenderer`：负责将 Typedoc 项目渲染为 VitePress 结构
- `FrontMatterGenerator`：生成每页的前置数据（front matter）
- `SidebarGenerator`：生成侧边栏配置

## 说明
- 插件在 Typedoc 转换完成事件（`Converter.EVENT_END`）触发渲染流程
- 结合工具库文档站点（`sunrise-utils`）可实现自动化 API 文档集成