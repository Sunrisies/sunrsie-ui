import * as crypto from "crypto";

/**
 * Slug生成器
 * 
 * 生成稳定的文件名slug，特别处理非ASCII字符和特殊符号
 * 确保生成的文件名在各种文件系统中都能安全使用
 */
export class SlugGenerator {
  private static readonly MAX_LENGTH = 50;
  private static readonly MIN_HASH_LENGTH = 8;

  /**
   * 生成稳定的文件名slug
   * 
   * @param name - 原始名称
   * @returns 安全的文件名slug
   * 
   * @example
   * ```typescript
   * SlugGenerator.generateSlug("MyClass") // "myclass"
   * SlugGenerator.generateSlug("函数名称") // "han-shu-ming-cheng" or "hanshum-12345678"
   * SlugGenerator.generateSlug("Special@Class#Name") // "specialclassname" or "specialcla-12345678"
   * ```
   */
  static generateSlug(name: string): string {
    if (!name) return "unknown";

    // 首先尝试转换基本字符
    const basicSlug = this.toBasicLatin(name);
    
    // 如果转换后为空或包含非ASCII字符，使用哈希
    if (!basicSlug || basicSlug.length > this.MAX_LENGTH || /[^a-z0-9-]/.test(basicSlug)) {
      return this.generateHashedSlug(name);
    }
    
    return basicSlug;
  }

  /**
   * 转换为基本拉丁字符
   */
  private static toBasicLatin(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // 移除重音符号
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // 移除非字母数字字符
      .replace(/\s+/g, "-") // 空格替换为连字符
      .replace(/-+/g, "-") // 多个连字符替换为一个
      .replace(/^-|-$/g, ""); // 移除开头和结尾的连字符
  }

  /**
   * 生成带哈希的slug
   */
  private static generateHashedSlug(name: string): string {
    const hash = crypto
      .createHash("md5")
      .update(name)
      .digest("hex")
      .substring(0, this.MIN_HASH_LENGTH);

    // 尝试提取名称中的有效字符作为前缀
    const prefix = this.extractValidPrefix(name);

    return prefix ? `${prefix}-${hash}` : hash;
  }

  /**
   * 提取有效的字符前缀
   */
  private static extractValidPrefix(name: string): string {
    // 提取前几个有效字符
    const validChars = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 10)
      .toLowerCase();

    return validChars || "";
  }

  /**
   * 生成文件路径（包括目录）
   * 
   * @param name - 原始名称
   * @param baseDir - 基础目录
   * @returns 完整的文件路径
   * 
   * @example
   * ```typescript
   * SlugGenerator.generateFilePath("MyClass", "./docs/api") // "./docs/api/myclass.md"
   * ```
   */
  static generateFilePath(name: string, baseDir: string): string {
    const slug = this.generateSlug(name);
    return `${baseDir}/${slug}.md`;
  }
}