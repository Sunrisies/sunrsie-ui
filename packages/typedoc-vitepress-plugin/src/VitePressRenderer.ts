import {
  DeclarationReflection,
  ProjectReflection,
  ReflectionKind,
  Options,
  Models,
} from "typedoc";
import * as fs from "fs";
import { promises as fsPromises } from "fs";
import * as path from "path";
import { FrontMatterGenerator } from "./FrontMatterGenerator";
import { SidebarGenerator } from "./SidebarGenerator";
import { VitePressOptions, RenderContext } from "./types";
import { CommentParser } from "./CommentParser";
import { SlugGenerator } from "./SlugGenerator";

/**
 * VitePress文档渲染器
 * 
 * 将TypeDoc的反射数据渲染为VitePress兼容的Markdown文档
 */
export class VitePressRenderer {
  private outputDir: string;
  private options: VitePressOptions;
  private incremental: boolean;
  private processedFiles: Set<string>;

  /**
   * 创建VitePress渲染器实例
   * 
   * @param typedocOptions - TypeDoc选项
   */
  constructor(typedocOptions: Options) {
    this.outputDir =
      (typedocOptions.getValue("vitepressOutput") as string) ||
      "./docs/.vitepress/api";
    this.incremental = (typedocOptions.getValue("vitepressIncremental") as boolean) || false;
    this.processedFiles = new Set();
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
  }

  private async clearOutputDir(): Promise<void> {
    try {
      if (fs.existsSync(this.outputDir)) {
        await fsPromises.rm(this.outputDir, { recursive: true });
      }
      // 确保输出目录存在
      await fsPromises.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to clear output directory: ${error}`);
      throw error;
    }
  }
  /**
   * 渲染整个TypeDoc项目为VitePress文档
   * 
   * @param project - TypeDoc项目反射
   */
  public async renderProject(project: ProjectReflection): Promise<void> {
    // 删除输出目录的内容 (只在非增量模式下)
    if (!this.incremental) {
      await this.clearOutputDir();
    } else {
      // 增量模式下确保目录存在
      await fsPromises.mkdir(this.outputDir, { recursive: true });
    }

    let children = new Map();

    // 渲染所有反射项
    if (project.children) {
      project.children.forEach((reflection) => {
        const module = this.getModule(reflection)?.split("/")[1];
        children.has(module)
          ? children.get(module).push(reflection)
          : children.set(module, [reflection]);
      });

      // Process modules sequentially to avoid race conditions
      for (const [key, value] of children.entries()) {
        await this.renderReflections(value);
      }
    }
    // // 生成索引页
    await this.generateIndex(project);

    // 生成侧边栏配置
    await this.generateSidebarConfig(project);

    // 增量模式下清理未使用的文件
    if (this.incremental) {
      await this.cleanupUnusedFiles();
    }
  }

  private async renderReflection(reflection: DeclarationReflection): Promise<void> {
    const content = this.generateMarkdownContent(reflection);
    const filename = this.getFilename(reflection);
    const filepath = path.join(this.outputDir, filename);

    // 跟踪处理的文件
    this.processedFiles.add(filename);

    // 增量模式下检查文件是否需要更新
    if (this.incremental && await this.shouldSkipFile(filepath, content)) {
      return;
    }

    try {
      await fsPromises.writeFile(filepath, content, "utf8");
    } catch (error) {
      console.error(`Failed to write file ${filepath}: ${error}`);
      throw error;
    }
  }
  // 组合式渲染
  private async renderReflections(reflection: DeclarationReflection[]): Promise<void> {
    let lines: string[] = [];
    reflection.sort((a, b) => a.kind - b.kind);

    reflection.forEach((item) => {
      if (item.kind === ReflectionKind.Function) {
        this.renderFunction(item, lines);
      }
      if (item.kind === ReflectionKind.Class) {
        lines.push(this.generateMarkdownContent(item));
      }
      if (item.kind === ReflectionKind.TypeAlias) {
        this.renderTypeAlias(item, lines);
      }
      if (item.kind === ReflectionKind.Interface) {
        lines.push(`## ${item.name} 接口`);
        lines.push(...this.renderInterface(item));
      }
    });
    const filename = this.getFilename(reflection[0]);
    const filepath = path.join(this.outputDir, filename);
    try {
      await fsPromises.writeFile(filepath, lines.join("\n"), "utf8");
    } catch (error) {
      console.error(`Failed to write file ${filepath}: ${error}`);
      throw error;
    }
  }
  // 函数的信息
  private renderFunction(
    reflection: DeclarationReflection,
    lines: string[]
  ): string[] {
    // 添加 FrontMatter
    lines.push(FrontMatterGenerator.generate(reflection, this.options));

    // 标题
    lines.push(`# ${reflection.name}`);
    lines.push("");

    // 模块信息（如果有）
    const module = this.getModule(reflection);
    const moduleTag = CommentParser.getModuleTag(reflection);
    const category = CommentParser.getCategory(reflection);

    if (module) {
      lines.push(`**模块**: \`${module}\``);
      lines.push("");
    }

    if (moduleTag) {
      lines.push(`**模块标签**: \`${moduleTag}\``);
      lines.push("");
    }

    if (category) {
      lines.push(`**分类**: \`${category}\``);
      lines.push("");
    }

    // 类型标签
    lines.push(this.renderKindBadge(reflection.kind));
    lines.push("");

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
          lines.push(...this.renderFunctionVariable(reflection));
        default:
          // 什么都不渲染
          break;
      }
    }
    return lines;
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
    const moduleTag = CommentParser.getModuleTag(reflection);
    const category = CommentParser.getCategory(reflection);

    if (module) {
      lines.push(`**模块**: \`${module}\``);
      lines.push("");
    }

    if (moduleTag) {
      lines.push(`**模块标签**: \`${moduleTag}\``);
      lines.push("");
    }

    if (category) {
      lines.push(`**分类**: \`${category}\``);
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

        default:
          // 什么都不渲染
          break;
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
    // 使用第一个签名作为主要签名
    const signature = signatures[0];

    // 函数签名
    lines.push("## 签名");
    lines.push("");
    lines.push("```typescript");
    lines.push(this.renderFunctionVariableSignature(reflection, signature));
    lines.push("```");
    lines.push("");

    // 参数说明
    if (signature.parameters && signature.parameters.length > 0) {
      lines.push("## 参数");
      lines.push("");
      lines.push("| 参数 | 类型 | 描述 |");
      lines.push("|-----------|------|-------------|");

      signature.parameters.forEach((param) => {
        const type = this.renderType(param.type);
        const description = param.comment?.summary[0].text || "";
        lines.push(`| ${param.name} | \`${type}\` | ${description} |`);
      });
      lines.push("");
    }
    // 返回值说明
    if (signature.type) {
      lines.push("## 返回值");
      lines.push("");
      lines.push(`**Type**: \`${this.renderType(signature.type)}\``);
      lines.push("");

      if (signature.comment?.blockTags) {
        lines.push(`> ${signature.comment.blockTags[0].content[0].text}`);
        lines.push("");
      }
    }
    // 添加案例
    this.addFunctionComment(reflection, lines);
    return lines;
  }
  /**
   * 添加函数的注释
   */
  private addFunctionComment(
    reflection: DeclarationReflection,
    lines: string[]
  ): string[] {
    if (!reflection.signatures) return lines;
    reflection.signatures.forEach((signature) => {
      const exampleComment = signature.comment?.blockTags?.filter(
        (tag) => tag.tag === "@example"
      );
      if (exampleComment) {
        // 处理多行示例
        exampleComment.forEach((tag, index) => {
          lines.push(`## 案例${index + 1}`);
          lines.push("");
          lines.push(tag.content[0].text.trim());
          lines.push("");
        });
      }
    });
    return lines;
  }
  /**
   * 添加案例
   */
  private addExample(
    reflection: DeclarationReflection,
    lines: string[]
  ): string[] {
    const exampleComment = reflection.comment?.blockTags?.filter(
      (tag) => tag.tag === "@example"
    );
    if (exampleComment) {
      // 处理多行示例
      exampleComment.forEach((tag, index) => {
        lines.push(`## 案例${index + 1}`);
        lines.push("");
        lines.push(tag.content[0].text.trim());
        lines.push("");
      });
    }
    return lines;
  }

  /**
   * 获取函数签名
   */
  private getFunctionSignatures(
    reflection: DeclarationReflection
  ): Models.SignatureReflection[] {
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
    signature: Models.SignatureReflection
  ): string {
    const params = signature.parameters
      ? signature.parameters
        .map(
          (param: Models.ParameterReflection) =>
            `${param.name}${param.flags?.isOptional ? "?" : ""
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
        const description = prop.comment?.label || "";
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
      lines.push("## 方法");
      lines.push("");

      methods.forEach((method) => {
        lines.push(`### ${method.name}`);
        lines.push("");

        if (method.signatures) {
          method.signatures.forEach((signature) => {
            if (signature.comment?.summary) {
              lines.push(`- ${signature.comment.summary[0].text}`);
              lines.push("");
            }
            lines.push("```typescript");
            lines.push(this.renderSignature(signature));
            lines.push("```");
            lines.push("");
          });
        }
      });
    }
    this.addExample(reflection, lines);
    return lines;
  }

  private renderInterface(reflection: DeclarationReflection): string[] {
    const lines: string[] = [];

    lines.push("## 属性");
    lines.push("");

    if (reflection.children) {
      lines.push("| Property | 类型 | 描述 |");
      lines.push("|----------|------|-------------|");

      reflection.children.forEach((child) => {
        const type = this.renderType(child.type);
        const description = child.comment?.summary[0].text || "";
        lines.push(`| ${child.name} | \`${type}\` | ${description} |`);
      });
      lines.push("");
    }

    return lines;
  }

  private renderTypeAlias(
    reflection: DeclarationReflection,
    lines: string[]
  ): string[] {
    lines.push("## 类型别名");
    lines.push("");
    lines.push(
      `> ${reflection.comment?.blockTags?.find((tag) => tag.tag === "@description")
        ?.content[0].text || ""
      }`
    );

    return lines;
  }

  private renderSignature(signature: Models.SignatureReflection): string {
    const params = signature.parameters
      ? signature.parameters
        .map(
          (param: any) =>
            `${param.name}${param.flags?.isOptional ? "?" : ""
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
        (param: Models.ParameterReflection) =>
          `${param.name}${param.flags?.isOptional ? "?" : ""
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
              .map((arg: Models.Type) => this.renderType(arg))
              .join(", ")}>`
            : "")
        );
      case "void":
        return "Function";
      case "array":
        return `${this.renderType(type.elementType)}[]`;
      case "union":
        return type.types.map((t: Models.Type) => this.renderType(t)).join(" | ");
      case "intersection":
        return type.types.map((t: Models.Type) => this.renderType(t)).join(" & ");
      case "literal":
        return typeof type.value === "string" ? `"${type.value}"` : type.value;
      case "reflection":
        // 处理函数类型
        if (type.declaration?.signatures) {
          const signature = type.declaration.signatures[0];
          const params = signature.parameters
            ? signature.parameters
              .map(
                (param: Models.ParameterReflection) =>
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
              (child: DeclarationReflection) =>
                `${child.name}${child.flags?.isOptional ? "?" : ""
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
    return `${SlugGenerator.generateSlug(reflection.name)}.md`;
  }

  // 在 VitePressRenderer.ts 中修改 generateIndex 方法
  private async generateIndex(project: ProjectReflection): Promise<void> {
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

    try {
      await fsPromises.writeFile(
        path.join(this.outputDir, "index.md"),
        lines.join("\n"),
        "utf8"
      );
    } catch (error) {
      console.error(`Failed to write index file: ${error}`);
      throw error;
    }
  }

  private async generateSidebarConfig(project: ProjectReflection): Promise<void> {
    const sidebar = SidebarGenerator.generate(project, this.options);
    const configPath = path.join(
      this.outputDir,
      "..",
      ".vitepress",
      "sidebar.json"
    );

    try {
      await fsPromises.writeFile(configPath, JSON.stringify(sidebar, null, 2), "utf8");
    } catch (error) {
      console.error(`Failed to write sidebar config: ${error}`);
      throw error;
    }
  }

  /**
   * 检查文件是否需要跳过（增量模式下）
   */
  private async shouldSkipFile(filepath: string, newContent: string): Promise<boolean> {
    try {
      const existingContent = await fsPromises.readFile(filepath, 'utf8');
      return existingContent === newContent;
    } catch {
      // 文件不存在，需要生成
      return false;
    }
  }

  /**
   * 清理未使用的文件（增量模式下）
   */
  private async cleanupUnusedFiles(): Promise<void> {
    try {
      const files = await fsPromises.readdir(this.outputDir);
      const markdownFiles = files.filter(file => file.endsWith('.md') && file !== 'index.md');

      for (const file of markdownFiles) {
        if (!this.processedFiles.has(file)) {
          const filepath = path.join(this.outputDir, file);
          await fsPromises.unlink(filepath);
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup unused files: ${error}`);
      // 不抛出错误，因为清理失败不影响主要功能
    }
  }
}
