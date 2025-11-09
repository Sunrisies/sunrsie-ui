// src/VitePressRenderer.ts
import {
  DeclarationReflection,
  ProjectReflection,
  ReflectionKind,
  Options,
  Models,
} from "typedoc";
import * as fs from "fs";
import * as path from "path";
import { FrontMatterGenerator } from "./FrontMatterGenerator";
import { SidebarGenerator } from "./SidebarGenerator";
import { VitePressOptions, RenderContext } from "./types";
import { CommentParser } from "./CommentParser";

export class VitePressRenderer {
  private outputDir: string;
  private options: VitePressOptions;

  constructor(typedocOptions: Options) {
    this.outputDir =
      (typedocOptions.getValue("vitepressOutput") as string) ||
      "./docs/.vitepress/api";
    this.options = {
      outputDir: this.outputDir,
      baseUrl: (typedocOptions.getValue("vitepressBaseUrl") as string) || "/",
      title:
        (typedocOptions.getValue("vitepressTitle") as string) ||
        "API Documentation",
      description:
        (typedocOptions.getValue("vitepressDescription") as string) ||
        "Auto-generated API documentation",
      frontmatter: {},
    };
    this.clearOutputDir();
  }

  private clearOutputDir(): void {
    if (fs.existsSync(this.outputDir)) {
      console.log("删除输出目录的内容", this.outputDir);
      fs.rmSync(this.outputDir, { recursive: true });
    }
    // 确保输出目录存在
    fs.mkdirSync(this.outputDir, { recursive: true });
  }
  public renderProject(project: ProjectReflection): void {
    console.log("开始进行解析");
    // 删除输出目录的内容
    this.clearOutputDir();
    // 渲染所有反射项
    if (project.children) {
      project.children.forEach((reflection) => {
        this.renderReflection(reflection);
      });
    }

    // // 生成索引页
    this.generateIndex(project);

    // 生成侧边栏配置
    this.generateSidebarConfig(project);
  }

  private renderReflection(reflection: DeclarationReflection): void {
    const content = this.generateMarkdownContent(reflection);
    const filename = this.getFilename(reflection);
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, content, "utf8");
  }

  // 在 VitePressRenderer.ts 中添加模块信息显示
  private generateMarkdownContent(reflection: DeclarationReflection): string {
    const lines: string[] = [];

    // 添加 FrontMatter
    lines.push(FrontMatterGenerator.generate(reflection, this.options));

    // 标题
    lines.push(`# ${reflection.name}`);
    lines.push("");

    // 模块信息（如果有）
    const module = this.getModule(reflection);
    console.log(module, "------------===============");
    if (module) {
      lines.push(`**模块**: \`${module}\``);
      lines.push("");
    }

    // 类型标签
    lines.push(this.renderKindBadge(reflection.kind));
    lines.push("");

    // 描述 - 使用函数描述（如果有）
    const functionDescription =
      CommentParser.getFunctionDescription(reflection);
    const fullDescription = CommentParser.getFullDescription(reflection);
    if (fullDescription) {
      lines.push("## 概述");
      lines.push("");
      lines.push(fullDescription);
      lines.push("");
    }

    // 处理不同类型的渲染
    if (
      reflection.kind === ReflectionKind.Variable &&
      this.isFunctionType(reflection)
    ) {
      lines.push(...this.renderFunctionVariable(reflection));
    } else {
      switch (reflection.kind) {
        case ReflectionKind.Class:
          lines.push(...this.renderClass(reflection));
          break;
        case ReflectionKind.Interface:
          lines.push(...this.renderInterface(reflection));
          break;
        case ReflectionKind.Function:
          lines.push(...this.renderFunction(reflection));
          break;
        case ReflectionKind.Component:
          lines.push(...this.renderComponent(reflection));
          break;
        default:
          lines.push(...this.renderDefault(reflection));
      }
    }

    return lines.join("\n");
  }
  /**
   * 提取模块信息（支持类和函数）
   */
  private getModule(reflection: DeclarationReflection): string | null {
    return CommentParser.getModule(reflection);
  }
  /**
   * 提取函数描述（支持类和函数）
   */
  private getFunctionDescription(
    reflection: DeclarationReflection
  ): string | null {
    return CommentParser.getFunctionDescription(reflection);
  }
  /**
   * 判断变量是否为函数类型
   */
  private isFunctionType(reflection: DeclarationReflection): boolean {
    // 检查类型是否为函数类型
    if (
      reflection.type?.type === "reflection" &&
      reflection.type.declaration?.signatures
    ) {
      return true;
    }

    // 检查变量是否有函数签名
    if (reflection.signatures && reflection.signatures.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * 渲染函数类型的变量
   */
  private renderFunctionVariable(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    // 获取函数签名
    const signatures = this.getFunctionSignatures(reflection);

    if (signatures.length === 0) {
      return this.renderDefault(reflection);
    }

    // 使用第一个签名作为主要签名
    const signature = signatures[0];

    // 函数签名
    lines.push("## Signature");
    lines.push("");
    lines.push("```typescript");
    lines.push(this.renderFunctionVariableSignature(reflection, signature));
    lines.push("```");
    lines.push("");

    // 参数说明
    if (signature.parameters && signature.parameters.length > 0) {
      lines.push("## Parameters");
      lines.push("");
      lines.push("| Parameter | Type | Description |");
      lines.push("|-----------|------|-------------|");

      signature.parameters.forEach((param) => {
        const type = this.renderType(param.type);
        const description = param.comment?.shortText || "";
        lines.push(`| ${param.name} | \`${type}\` | ${description} |`);
      });
      lines.push("");
    }

    // 返回值说明
    if (signature.type) {
      lines.push("## Returns");
      lines.push("");
      lines.push(`**Type**: \`${this.renderType(signature.type)}\``);
      lines.push("");

      if (signature.comment?.returns) {
        lines.push(signature.comment.returns);
        lines.push("");
      }
    }

    // 示例代码
    const exampleComment = reflection.comment?.tags?.find(
      (tag) => tag.tagName === "example"
    );
    if (exampleComment) {
      lines.push("## Example");
      lines.push("");
      lines.push("```typescript");
      lines.push(exampleComment.text.trim());
      lines.push("```");
      lines.push("");
    } else if (
      reflection.comment?.tags?.some((tag) => tag.tagName === "example")
    ) {
      // 处理多行示例
      const exampleTags = reflection.comment.tags.filter(
        (tag) => tag.tagName === "example"
      );
      lines.push("## Example");
      lines.push("");
      exampleTags.forEach((tag) => {
        lines.push("```typescript");
        lines.push(tag.text.trim());
        lines.push("```");
        lines.push("");
      });
    }

    return lines;
  }

  /**
   * 获取函数签名
   */
  private getFunctionSignatures(reflection: DeclarationReflection): any[] {
    // 从类型声明中获取签名
    if (
      reflection.type?.type === "reflection" &&
      reflection.type.declaration?.signatures
    ) {
      return reflection.type.declaration.signatures;
    }

    // 从变量本身获取签名
    if (reflection.signatures) {
      return reflection.signatures;
    }

    return [];
  }

  /**
   * 渲染函数变量签名
   */
  private renderFunctionVariableSignature(
    reflection: DeclarationReflection,
    signature: any
  ): string {
    const params = signature.parameters
      ? signature.parameters
          .map(
            (param: any) =>
              `${param.name}${
                param.flags?.isOptional ? "?" : ""
              }: ${this.renderType(param.type)}`
          )
          .join(", ")
      : "";

    const returnType = signature.type
      ? this.renderType(signature.type)
      : "void";

    return `const ${reflection.name} = (${params}): ${returnType}`;
  }

  private renderKindBadge(kind: ReflectionKind): string {
    const kindName = ReflectionKind[kind];
    const badgeColors: Record<string, string> = {
      Class: "blue",
      Interface: "green",
      Function: "purple",
      Component: "orange",
      TypeAlias: "gray",
      Variable: "yellow",
    };

    const color = badgeColors[kindName] || "gray";
    return `<Badge type="tip" text="${kindName}" color="${color}" />`;
  }

  private renderClass(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    // 构造函数
    const constructor = reflection.children?.find(
      (child) => child.kind === ReflectionKind.Constructor
    );

    if (constructor) {
      lines.push("## Constructor");
      lines.push("");
      lines.push("```typescript");
      lines.push(
        `new ${reflection.name}(${this.renderParameters(constructor)})`
      );
      lines.push("```");
      lines.push("");
    }

    // 属性
    const properties =
      reflection.children?.filter(
        (child) => child.kind === ReflectionKind.Property
      ) || [];

    if (properties.length > 0) {
      lines.push("## Properties");
      lines.push("");
      lines.push("| Name | Type | Description |");
      lines.push("|------|------|-------------|");

      properties.forEach((prop) => {
        const type = this.renderType(prop.type);
        const description = prop.comment?.shortText || "";
        lines.push(`| ${prop.name} | \`${type}\` | ${description} |`);
      });
      lines.push("");
    }

    // 方法
    const methods =
      reflection.children?.filter(
        (child) => child.kind === ReflectionKind.Method
      ) || [];

    if (methods.length > 0) {
      lines.push("## Methods");
      lines.push("");

      methods.forEach((method) => {
        lines.push(`### ${method.name}`);
        lines.push("");

        if (method.signatures) {
          method.signatures.forEach((signature) => {
            lines.push("```typescript");
            lines.push(this.renderSignature(signature));
            lines.push("```");
            lines.push("");

            if (signature.comment?.text) {
              lines.push(signature.comment.text);
              lines.push("");
            }
          });
        }
      });
    }

    return lines;
  }

  private renderComponent(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    lines.push("## Props");
    lines.push("");

    const props =
      reflection.children?.filter(
        (child) => child.kind === ReflectionKind.Property
      ) || [];

    if (props.length > 0) {
      lines.push("| Prop | Type | Default | Required | Description |");
      lines.push("|------|------|---------|----------|-------------|");

      props.forEach((prop) => {
        const type = this.renderType(prop.type);
        const description = prop.comment?.shortText || "";
        const defaultValue =
          prop.comment?.tags?.find((tag) => tag.tagName === "default")?.text ||
          "-";
        const required = prop.flags.isOptional ? "No" : "Yes";

        lines.push(
          `| ${prop.name} | \`${type}\` | ${defaultValue} | ${required} | ${description} |`
        );
      });
      lines.push("");
    }

    // 示例用法
    lines.push("## Usage");
    lines.push("");
    lines.push("```tsx");
    lines.push(`import { ${reflection.name} } from 'your-library';`);
    lines.push("");
    lines.push(`function Example() {`);
    lines.push(`  return <${reflection.name} />;`);
    lines.push(`}`);
    lines.push("```");
    lines.push("");

    return lines;
  }

  private renderFunction(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    if (reflection.signatures) {
      reflection.signatures.forEach((signature) => {
        lines.push("## Signature");
        lines.push("");
        lines.push("```typescript");
        lines.push(this.renderSignature(signature));
        lines.push("```");
        lines.push("");

        // 参数表格
        if (signature.parameters && signature.parameters.length > 0) {
          lines.push("### Parameters");
          lines.push("");
          lines.push("| Parameter | Type | Description |");
          lines.push("|-----------|------|-------------|");

          signature.parameters.forEach((param) => {
            const type = this.renderType(param.type);
            const description = param.comment?.shortText || "";
            lines.push(`| ${param.name} | \`${type}\` | ${description} |`);
          });
          lines.push("");
        }

        // 返回值
        if (signature.type) {
          lines.push("### Returns");
          lines.push("");
          lines.push(`Type: \`${this.renderType(signature.type)}\``);
          lines.push("");

          if (signature.comment?.returns) {
            lines.push(signature.comment.returns);
            lines.push("");
          }
        }
      });
    }

    // 示例
    lines.push("## Example");
    lines.push("");
    lines.push("```typescript");
    lines.push(`import { ${reflection.name} } from 'your-library';`);
    lines.push("");
    lines.push(`// Usage example`);
    lines.push(`const result = ${reflection.name}();`);
    lines.push("```");
    lines.push("");

    return lines;
  }

  private renderInterface(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    lines.push("## Properties");
    lines.push("");

    if (reflection.children) {
      lines.push("| Property | Type | Description |");
      lines.push("|----------|------|-------------|");

      reflection.children.forEach((child) => {
        const type = this.renderType(child.type);
        const description = child.comment?.shortText || "";
        lines.push(`| ${child.name} | \`${type}\` | ${description} |`);
      });
      lines.push("");
    }

    return lines;
  }

  private renderDefault(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    lines.push("## Type Definition");
    lines.push("");
    lines.push("```typescript");
    lines.push(this.renderTypeDefinition(reflection));
    lines.push("```");
    lines.push("");

    return lines;
  }

  private renderSignature(signature: any): string {
    const params = signature.parameters
      ? signature.parameters
          .map(
            (param: any) =>
              `${param.name}${
                param.flags?.isOptional ? "?" : ""
              }: ${this.renderType(param.type)}`
          )
          .join(", ")
      : "";

    const returnType = signature.type
      ? this.renderType(signature.type)
      : "void";

    return `function ${signature.name}(${params}): ${returnType}`;
  }

  private renderParameters(reflection: DeclarationReflection): string {
    if (!reflection.signatures?.[0]?.parameters) return "";

    return reflection.signatures[0].parameters
      .map(
        (param: any) =>
          `${param.name}${
            param.flags?.isOptional ? "?" : ""
          }: ${this.renderType(param.type)}`
      )
      .join(", ");
  }

  // 在 renderType 方法中添加对函数类型的支持
  private renderType(type: any): string {
    if (!type) return "any";

    switch (type.type) {
      case "intrinsic":
        return type.name;
      case "reference":
        return (
          type.name +
          (type.typeArguments
            ? `<${type.typeArguments
                .map((arg: any) => this.renderType(arg))
                .join(", ")}>`
            : "")
        );
      case "array":
        return `${this.renderType(type.elementType)}[]`;
      case "union":
        return type.types.map((t: any) => this.renderType(t)).join(" | ");
      case "intersection":
        return type.types.map((t: any) => this.renderType(t)).join(" & ");
      case "literal":
        return typeof type.value === "string" ? `"${type.value}"` : type.value;
      case "reflection":
        // 处理函数类型
        if (type.declaration?.signatures) {
          const signature = type.declaration.signatures[0];
          const params = signature.parameters
            ? signature.parameters
                .map(
                  (param: any) =>
                    `${param.name}: ${this.renderType(param.type)}`
                )
                .join(", ")
            : "";
          const returnType = signature.type
            ? this.renderType(signature.type)
            : "void";
          return `(${params}) => ${returnType}`;
        }
        // 处理对象类型
        if (type.declaration && type.declaration.children) {
          const props = type.declaration.children
            .map(
              (child: any) =>
                `${child.name}${
                  child.flags?.isOptional ? "?" : ""
                }: ${this.renderType(child.type)}`
            )
            .join("; ");
          return `{ ${props} }`;
        }
        return "object";
      case "typeOperator":
        return `${type.operator} ${this.renderType(type.target)}`;
      default:
        return type.name || "any";
    }
  }

  private getFilename(reflection: DeclarationReflection): string {
    const name = reflection.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `${name}.md`;
  }

  // 在 VitePressRenderer.ts 中修改 generateIndex 方法
  private generateIndex(project: ProjectReflection): void {
    const lines: string[] = [];

    lines.push("---");
    lines.push("title: API 参考");
    lines.push("description: 完整的 API 文档");
    lines.push("---");
    lines.push("");
    lines.push("# API 参考");
    lines.push("");
    lines.push("欢迎使用 API 文档。此参考包含所有导出成员的详细信息。");
    lines.push("");

    if (project.children) {
      // 按模块分组
      const modules: Record<string, DeclarationReflection[]> = {};

      for (const reflection of project.children) {
        const module = this.getModule(reflection) || "Global";
        if (!modules[module]) {
          modules[module] = [];
        }
        modules[module].push(reflection);
      }

      // 按模块名称排序
      const sortedModuleNames = Object.keys(modules).sort();

      for (const moduleName of sortedModuleNames) {
        const moduleReflections = modules[moduleName];

        lines.push(`## ${moduleName}`);
        lines.push("");

        // 按名称排序
        moduleReflections.sort((a, b) => a.name.localeCompare(b.name));

        moduleReflections.forEach((reflection) => {
          const functionDescription = this.getFunctionDescription(reflection);
          const displayText = functionDescription || reflection.name;
          const link = this.getFilename(reflection).replace(".md", "");
          lines.push(`- [${displayText}](${link})`);
        });
        lines.push("");
      }
    }

    fs.writeFileSync(
      path.join(this.outputDir, "index.md"),
      lines.join("\n"),
      "utf8"
    );
  }

  private generateSidebarConfig(project: ProjectReflection): void {
    const sidebar = SidebarGenerator.generate(project, this.options);
    const configPath = path.join(
      this.outputDir,
      "..",
      ".vitepress",
      "sidebar.json"
    );

    fs.writeFileSync(configPath, JSON.stringify(sidebar, null, 2), "utf8");
  }

  /**
   * 将嵌套的侧边栏结构转换为扁平化结构
   */
  private convertToFlatSidebar(sidebarData: any): any[] {
    const flatSidebar: any[] = [];

    // 遍历每个路径的侧边栏配置
    for (const [path, sidebarGroups] of Object.entries(sidebarData)) {
      if (Array.isArray(sidebarGroups)) {
        sidebarGroups.forEach((group) => {
          // 将每个组转换为扁平化结构
          const flatGroup = this.flattenSidebarGroup(group, path);
          if (flatGroup) {
            flatSidebar.push(flatGroup);
          }
        });
      }
    }

    return flatSidebar;
  }
  /**
   * 扁平化侧边栏组
   */
  private flattenSidebarGroup(group: any, basePath: string): any {
    if (!group.items || !Array.isArray(group.items)) {
      return null;
    }

    // 处理嵌套的 items
    const flatItems: any[] = [];

    group.items.forEach((item: any) => {
      if (item.items && Array.isArray(item.items)) {
        // 如果 item 还有嵌套的 items，递归处理
        item.items.forEach((nestedItem: any) => {
          flatItems.push({
            text: nestedItem.text,
            link: this.ensureAbsoluteLink(nestedItem.link, basePath),
          });
        });
      } else {
        // 直接添加普通 item
        flatItems.push({
          text: item.text,
          link: this.ensureAbsoluteLink(item.link, basePath),
        });
      }
    });

    return {
      text: group.text,
      collapsible: group.collapsible !== undefined ? group.collapsible : true,
      collapsed: group.collapsed !== undefined ? group.collapsed : false,
      items: flatItems,
    };
  }
  /**
   * 确保链接是绝对路径
   */
  private ensureAbsoluteLink(link: string, basePath: string): string {
    if (!link) return link;

    // 如果链接不是以 / 开头，添加基础路径
    if (!link.startsWith("/")) {
      return `${basePath}${link}`;
    }

    return link;
  }

  /**
   * 生成侧边栏 Markdown 文件
   */
  private generateSidebarMarkdown(project: ProjectReflection): void {
    if (!project.children) return;

    const lines: string[] = [];

    lines.push("- [API 概览](../api/)");
    lines.push("");

    // 按模块分组
    const modules: Record<string, DeclarationReflection[]> = {};

    for (const reflection of project.children) {
      const module = this.getModule(reflection) || "Global";
      if (!modules[module]) {
        modules[module] = [];
      }
      modules[module].push(reflection);
    }

    // 按模块名称排序
    const sortedModuleNames = Object.keys(modules).sort();

    for (const moduleName of sortedModuleNames) {
      const moduleReflections = modules[moduleName];
      const moduleSlug = moduleName.toLowerCase().replace(/[^a-z0-9]/g, "-");

      lines.push(`- **${moduleName}**`);
      lines.push(`  - [模块概览](../api/modules/${moduleSlug})`);

      // 按名称排序
      moduleReflections.sort((a, b) => a.name.localeCompare(b.name));

      moduleReflections.forEach((reflection) => {
        const functionDescription = this.getFunctionDescription(reflection);
        const displayText = functionDescription || reflection.name;
        const link = `../api/${this.getFilename(reflection).replace(
          ".md",
          ""
        )}`;

        lines.push(`  - [${reflection.name}](${link})`);
      });

      lines.push("");
    }

    const sidebarDir = path.join(this.outputDir, "..", ".vitepress");
    if (!fs.existsSync(sidebarDir)) {
      fs.mkdirSync(sidebarDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(sidebarDir, "sidebar-api.md"),
      lines.join("\n"),
      "utf8"
    );
  }

  /**
   * 生成导航文件
   */
  private generateNavFile(project: ProjectReflection): void {
    const lines: string[] = [];

    lines.push("---");
    lines.push("title: API 参考");
    lines.push("description: 完整的 API 文档");
    lines.push("sidebar: false");
    lines.push("---");
    lines.push("");
    lines.push("# API 参考");
    lines.push("");
    lines.push("欢迎使用 API 文档。此参考包含所有导出成员的详细信息。");
    lines.push("");

    if (project.children) {
      // 按模块分组
      const modules: Record<string, DeclarationReflection[]> = {};

      for (const reflection of project.children) {
        const module = this.getModule(reflection) || "Global";
        if (!modules[module]) {
          modules[module] = [];
        }
        modules[module].push(reflection);
      }

      // 按模块名称排序
      const sortedModuleNames = Object.keys(modules).sort();

      for (const moduleName of sortedModuleNames) {
        const moduleReflections = modules[moduleName];

        lines.push(`## ${moduleName}`);
        lines.push("");
        lines.push(`> ${this.getModuleDescription(moduleName)}`);
        lines.push("");

        // 按名称排序
        moduleReflections.sort((a, b) => a.name.localeCompare(b.name));

        lines.push("| 名称 | 描述 | 类型 |");
        lines.push("|------|------|------|");

        moduleReflections.forEach((reflection) => {
          const functionDescription = this.getFunctionDescription(reflection);
          const displayText =
            functionDescription || this.getShortDescription(reflection);
          const kind = ReflectionKind[reflection.kind];
          const link = this.getFilename(reflection).replace(".md", "");
          const kindBadge = this.getKindBadge(kind);

          lines.push(
            `| [${reflection.name}](${link}) | ${displayText} | ${kindBadge} |`
          );
        });
        lines.push("");
      }
    }

    fs.writeFileSync(
      path.join(this.outputDir, "index.md"),
      lines.join("\n"),
      "utf8"
    );
  }
  /**
   * 为每个模块生成索引文件
   */
  private generateModuleIndexFiles(project: ProjectReflection): void {
    if (!project.children) return;

    // 按模块分组
    const modules: Record<string, DeclarationReflection[]> = {};

    for (const reflection of project.children) {
      const module = this.getModule(reflection) || "Global";
      if (!modules[module]) {
        modules[module] = [];
      }
      modules[module].push(reflection);
    }

    // 为每个模块生成单独的索引文件
    for (const [moduleName, reflections] of Object.entries(modules)) {
      this.generateSingleModuleIndex(moduleName, reflections);
    }
  }

  /**
   * 生成单个模块的索引文件
   */
  private generateSingleModuleIndex(
    moduleName: string,
    reflections: DeclarationReflection[]
  ): void {
    const lines: string[] = [];

    const moduleDir = path.join(this.outputDir, "modules");
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    const moduleSlug = moduleName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    lines.push("---");
    lines.push(`title: "${moduleName} 模块"`);
    lines.push(`description: "${this.getModuleDescription(moduleName)}"`);
    lines.push("---");
    lines.push("");
    lines.push(`# ${moduleName} 模块`);
    lines.push("");
    lines.push(this.getModuleDescription(moduleName));
    lines.push("");

    // 按类型分组
    const groups = this.groupByKind(reflections);

    for (const [kind, kindReflections] of Object.entries(groups)) {
      if (kindReflections.length > 0) {
        lines.push(`## ${this.getKindDisplayName(kind)}`);
        lines.push("");

        kindReflections.sort((a, b) => a.name.localeCompare(b.name));

        lines.push("| 名称 | 描述 |");
        lines.push("|------|------|");

        kindReflections.forEach((reflection) => {
          const functionDescription = this.getFunctionDescription(reflection);
          const displayText =
            functionDescription || this.getShortDescription(reflection);
          const link = `../${this.getFilename(reflection).replace(".md", "")}`;

          lines.push(`| [${reflection.name}](${link}) | ${displayText} |`);
        });
        lines.push("");
      }
    }

    fs.writeFileSync(
      path.join(moduleDir, `${moduleSlug}.md`),
      lines.join("\n"),
      "utf8"
    );
  }

  /**
   * 获取模块描述
   */
  private getModuleDescription(moduleName: string): string {
    const moduleDescriptions: Record<string, string> = {
      "browser/http": "浏览器 HTTP 请求工具集，提供文件下载和 HTTP 客户端功能",
      browser: "浏览器相关工具函数",
      common: "通用工具函数和工具类",
      utils: "工具函数集合",
      Global: "全局函数和工具",
    };

    return (
      moduleDescriptions[moduleName] ||
      `${moduleName} 模块包含相关的 API 函数和类`
    );
  }

  /**
   * 获取简短的描述
   */
  private getShortDescription(reflection: DeclarationReflection): string {
    if (reflection.comment?.shortText) {
      return reflection.comment.shortText;
    }

    if (reflection.signatures?.[0]?.comment?.shortText) {
      return reflection.signatures[0].comment.shortText;
    }

    if (
      reflection.type?.type === "reflection" &&
      reflection.type.declaration?.signatures?.[0]?.comment?.shortText
    ) {
      return reflection.type.declaration.signatures[0].comment.shortText;
    }

    return "暂无描述";
  }

  /**
   * 获取类型徽章
   */
  private getKindBadge(kind: string): string {
    const badgeColors: Record<string, string> = {
      Class: "blue",
      Interface: "green",
      Function: "purple",
      Variable: "yellow",
      TypeAlias: "gray",
      Enum: "orange",
    };

    const color = badgeColors[kind] || "gray";
    return `<Badge type="tip" text="${kind}" color="${color}" />`;
  }

  private groupByKind(
    reflections: DeclarationReflection[]
  ): Record<string, DeclarationReflection[]> {
    const groups: Record<string, DeclarationReflection[]> = {};

    for (const reflection of reflections) {
      const kind = ReflectionKind[reflection.kind];
      if (!groups[kind]) {
        groups[kind] = [];
      }
      groups[kind].push(reflection);
    }

    return groups;
  }

  private getKindDisplayName(kind: string): string {
    const displayNames: Record<string, string> = {
      Class: "Classes",
      Interface: "Interfaces",
      Function: "Functions",
      Component: "Components",
      TypeAlias: "Type Aliases",
      Variable: "Variables",
      Enum: "Enums",
    };

    return displayNames[kind] || `${kind}s`;
  }
}
