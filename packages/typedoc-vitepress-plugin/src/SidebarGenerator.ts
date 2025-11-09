// src/SidebarGenerator.ts
import {
  ProjectReflection,
  ReflectionKind,
  DeclarationReflection,
} from "typedoc";
import { VitePressOptions, ModuleInfo } from "./types";
import { CommentParser } from "./CommentParser";
// 建立一个映射 browser 对应的是浏览器，util对应的是工具, common对应的是通用
const kindMap: Record<string, string> = {
  browser: "浏览器",
  util: "工具",
  common: "通用",
};
export class SidebarGenerator {
  /**
   * 提取模块信息（支持类和函数）
   */
  private static getModule(
    reflection: DeclarationReflection,
    name?: string
  ): string | null {
    return CommentParser.getModule(reflection, name);
  }
  static generate(project: ProjectReflection, options: VitePressOptions): any {
    const modules: Record<string, ModuleInfo> = {};

    if (project.children) {
      // 首先按模块分组
      for (const reflection of project.children) {
        const moduleName =
          this.getModule(reflection)?.split("/")[0] || "Global";
        const itemDescription = this.getModule(reflection, "@func");
        if (!modules[moduleName]) {
          modules[moduleName] = {
            name: kindMap[moduleName] || moduleName,
            description: this.getModuleDescription(moduleName),
            items: [],
          };
        }

        modules[moduleName].items.push({
          name: kindMap[reflection.kind] || reflection.name,
          description: itemDescription!,
          link: this.getLink(reflection, options),
          kind: ReflectionKind[reflection.kind],
        });
      }
    }
    console.log(JSON.stringify(modules, null, 2), "modules");
    // 转换为 VitePress 侧边栏格式
    return this.convertToVitePressSidebar(modules, options);
  }

  /**
   * 获取模块描述
   */
  private static getModuleDescription(moduleName: string): string {
    const moduleDescriptions: Record<string, string> = {
      "browser/http": "浏览器 HTTP 请求工具",
      browser: "浏览器相关工具",
      common: "通用工具函数",
      utils: "工具函数集合",
      // 可以继续添加更多模块描述
    };

    return moduleDescriptions[moduleName] || `${moduleName} 模块`;
  }

  /**
   * 转换为 VitePress 侧边栏格式
   */
  private static convertToVitePressSidebar(
    modules: Record<string, ModuleInfo>,
    options: VitePressOptions
  ): any {
    const sidebarItems: any[] = [];

    // 按模块名称排序
    const sortedModuleNames = Object.keys(modules).sort();
    // console.log(sortedModuleNames, "sortedModuleNames");
    for (const moduleName of sortedModuleNames) {
      const module = modules[moduleName];

      // 对模块内的项目按名称排序
      module.items.sort((a, b) => a.name.localeCompare(b.name));
      // console.log(module, "module");
      sidebarItems.push({
        text: module.name.split("/")[0],
        collapsible: true,
        collapsed: false,
        items: module.items.map((item) => ({
          text: item.description, // 使用函数描述作为显示文本
          link: item.link,
        })),
      });
    }
    // console.log(sidebarItems, "1-1-1-1-1-1-");
    return sidebarItems;
  }

  private static getLink(
    reflection: DeclarationReflection,
    options: VitePressOptions
  ): string {
    const name = reflection.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `/docs/${name}`;
  }
}
