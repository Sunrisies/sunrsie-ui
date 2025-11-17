/**
 * TypeDoc VitePress Plugin
 * 
 * A TypeDoc plugin that generates VitePress-compatible documentation from TypeScript code.
 * 
 * @example
 * ```typescript
 * // typedoc.json
 * {
 *   "plugin": ["typedoc-vitepress-plugin"],
 *   "vitepressOutput": "./docs/api",
 *   "vitepressBaseUrl": "/",
 *   "vitepressTitle": "API Documentation",
 *   "vitepressDescription": "Generated API documentation"
 * }
 * ```
 */
import {
  Application,
  ParameterType,
  Converter,
  Context,
  EventDispatcher,
} from "typedoc";
import { VitePressRenderer } from "./VitePressRenderer";

/**
 * Load the TypeDoc VitePress plugin
 * 
 * @param app - TypeDoc application instance
 */
export function load(app: Application) {
  // 注册插件选项
  app.options.addDeclaration({
    name: "vitepressOutput",
    help: "Output directory for VitePress documentation",
    type: ParameterType.String,
    defaultValue: "./docs/.vitepress/api",
  });

  app.options.addDeclaration({
    name: "vitepressBaseUrl",
    help: "Base URL for VitePress documentation",
    type: ParameterType.String,
    defaultValue: "/",
  });

  app.options.addDeclaration({
    name: "vitepressTitle",
    help: "Title for VitePress documentation",
    type: ParameterType.String,
    defaultValue: "API Documentation",
  });

  app.options.addDeclaration({
    name: "vitepressDescription",
    help: "Description for VitePress documentation",
    type: ParameterType.String,
    defaultValue: "Auto-generated API documentation",
  });

  app.options.addDeclaration({
    name: "vitepressIncremental",
    help: "Enable incremental generation (only regenerate changed files)",
    type: ParameterType.Boolean,
    defaultValue: false,
  });

  //   在转换完成后生成 VitePress 文档
  (app.converter as EventDispatcher).on(
    Converter.EVENT_END,
    async (context: Context) => {
      const renderer = new VitePressRenderer(app.options);
      try {
        await renderer.renderProject(context.project);
      } catch (error) {
        console.error("Failed to render VitePress documentation:", error);
        throw error;
      }
    }
  );
}

// 导出类型供外部使用
export { VitePressRenderer } from "./VitePressRenderer";
export { FrontMatterGenerator } from "./FrontMatterGenerator";
export { SidebarGenerator } from "./SidebarGenerator";
