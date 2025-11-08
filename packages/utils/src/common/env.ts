/**
 * 运行环境类型
 */
export type RuntimeEnvironment = 'browser' | 'node' | 'unknown';

/**
 * 检测当前运行环境
 * @returns 返回当前运行环境类型
 */
export function detectEnvironment(): RuntimeEnvironment {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return 'browser';
    }
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        return 'node';
    }
    return 'unknown';
}

/**
 * 检查是否在浏览器环境中运行
 */
export function isBrowser(): boolean {
    return detectEnvironment() === 'browser';
}

/**
 * 检查是否在 Node.js 环境中运行
 */
export function isNode(): boolean {
    return detectEnvironment() === 'node';
}

/**
 * 确保代码在特定环境中运行
 * @param env 期望的运行环境
 * @param feature 功能名称
 */
export function ensureEnvironment(env: RuntimeEnvironment, feature: string): void {
    const currentEnv = detectEnvironment();
    if (currentEnv !== env) {
        throw new Error(`${feature} 只能在 ${env} 环境中使用，当前环境为 ${currentEnv}`);
    }
}