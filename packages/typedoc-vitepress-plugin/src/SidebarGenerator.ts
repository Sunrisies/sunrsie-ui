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
    const categories: Record<string, ModuleInfo> = {};

    if (project.children) {
      // 首先按模块和分类分组
      for (const reflection of project.children) {
        const moduleName = this.getModule(reflection)?.split("/")[0] || "Global";
        const category = CommentParser.getCategory(reflection) || moduleName;
        const moduleTag = CommentParser.getModuleTag(reflection) || moduleName;
        const itemDescription = this.getModule(reflection, "@func") || reflection.name;

        // 使用分类作为主要分组，模块作为子分组
        const groupKey = category || moduleName;

        if (!categories[groupKey]) {
          categories[groupKey] = {
            name: kindMap[groupKey] || groupKey,
            description: this.getModuleDescription(groupKey),
            items: [],
            subgroups: {},
          };
        }

        // 根据类型决定是否显示在侧边栏中
        if (this.shouldIncludeInSidebar(reflection)) {
          const item = {
            name: reflection.name,
            description: itemDescription,
            link: this.getLink(reflection, options),
            kind: ReflectionKind[reflection.kind],
            module: moduleTag,
          };

          // 如果有子模块，创建子分组
          if (moduleTag !== groupKey) {
            if (!categories[groupKey].subgroups![moduleTag]) {
              categories[groupKey].subgroups![moduleTag] = {
                name: kindMap[moduleTag] || moduleTag,
                items: [],
              };
            }
            categories[groupKey].subgroups![moduleTag].items.push(item);
          } else {
            categories[groupKey].items.push(item);
          }
        }
      }
    }

    // 转换为 VitePress 侧边栏格式
    return this.convertToVitePressSidebar(categories, options);
  }

  /**
   * 判断反射是否应包含在侧边栏中
   */
  private static shouldIncludeInSidebar(reflection: DeclarationReflection): boolean {
    // 排除接口和类型别名，除非它们有重要的文档
    if (reflection.kind === ReflectionKind.Interface ||
      reflection.kind === ReflectionKind.TypeAlias) {
      // 如果有详细的注释或示例，则包含
      return !!(
        reflection.comment?.blockTags?.some(tag => tag.tag === "@example"));
    }

    return true;
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
    categories: Record<string, ModuleInfo>,
    options: VitePressOptions
  ): any {
    const sidebarItems: any[] = [];

    // 按分类名称排序
    const sortedCategoryNames = Object.keys(categories).sort();

    for (const categoryName of sortedCategoryNames) {
      const category = categories[categoryName];

      // 对分类内的项目按名称排序
      category.items.sort((a, b) => a.name.localeCompare(b.name));

      // 创建主分类项
      const categoryItem: any = {
        text: category.name,
        collapsible: true,
        collapsed: false,
        items: [],
      };

      // 添加直接属于分类的项目
      category.items.forEach((item) => {
        categoryItem.items.push({
          text: item.description || item.name,
          link: item.link,
        });
      });

      // 添加子分组
      if (category.subgroups) {
        const sortedSubgroupNames = Object.keys(category.subgroups).sort();

        for (const subgroupName of sortedSubgroupNames) {
          const subgroup = category.subgroups[subgroupName];

          // 对子分组内的项目按名称排序
          subgroup.items.sort((a, b) => a.name.localeCompare(b.name));

          categoryItem.items.push({
            text: subgroup.name,
            collapsible: true,
            collapsed: true,
            items: subgroup.items.map((item) => ({
              text: item.description || item.name,
              link: item.link,
            })),
          });
        }
      }

      sidebarItems.push(categoryItem);
    }

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
