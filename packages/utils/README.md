# sunrise-utils

一个使用 TypeScript 构建的浏览器/通用工具函数库，提供日期、格式化、字符串、计时器与地图相关方法，以及浏览器端的 DOM、HTTP、图片处理等工具。内置文档与测试流程。

## 安装与开发
- 安装依赖（在仓库根目录）：`pnpm install`
- 开发监听：`pnpm --filter sunrise-utils dev`
- TypeScript 编译：`pnpm --filter sunrise-utils tsc`
- 单元测试（Jest/Vitest，按包内配置）：`pnpm --filter sunrise-utils test`
- 覆盖率报告：`pnpm --filter sunrise-utils coverage`
- 文档生成（Typedoc）：`pnpm --filter sunrise-utils typedoc`
- 文档站点（VitePress）：
  - 开发：`pnpm --filter sunrise-utils docs:dev`
  - 构建：`pnpm --filter sunrise-utils docs:build`
  - 预览：`pnpm --filter sunrise-utils docs:preview`

覆盖率报告输出在 `packages/utils/coverage/`。

## 模块结构
- 浏览器模块：`browser/dom`、`browser/http`、`browser/images`
- 通用模块：`common/date`、`common/format`、`common/string`、`common/timer`、`common/activity`
- 地图相关：`common/map/*`（坐标转换、距离计算、点生成等）

## 使用示例
相对时间描述：

```ts
import { getRelativeTime } from 'sunrise-utils'

getRelativeTime(new Date(Date.now() - 2 * 60_000)) // "2分钟前"
getRelativeTime(new Date(Date.now() + 60_000), { locale: 'en-US' }) // "in 1 minute"
```

文件大小格式化：

```ts
import { formatBytes } from 'sunrise-utils'

formatBytes(1024) // "1 KB"
formatBytes(1024, { base: 1024, useIECUnits: true }) // "1 KiB"
```

浏览器图片工具：

```ts
import { loadImage } from 'sunrise-utils'

const img = await loadImage('https://example.com/a.png')
```

## 其他
- 发布与推送脚本参考包内 `publish.js`、`docs:push` 等命令
- 建议在 Monorepo 中通过 `pnpm --filter sunrise-utils <cmd>` 精准运行