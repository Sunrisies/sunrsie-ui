import { describe, test, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { preloadAndCacheImage, preloadAndCacheImages } from "../browser/index";

describe('preloadAndCacheImages 工具函数', () => {
    let originalImage: typeof Image
    const mockImageLoad = vi.fn()
    const mockImageError = vi.fn()

    beforeEach(() => {
        originalImage = global.Image;

        // 创建不带 HTMLImageElement 继承的模拟类
        global.Image = class MockImage {
            src: string = '';
            onload: () => void = vi.fn();
            onerror: () => void = vi.fn();
            complete = false;
            naturalWidth = 100;

            constructor() {
                // 添加延迟触发逻辑
                setTimeout(() => {
                    if (this.src.startsWith('valid')) {
                        this.complete = true;
                        this.onload();
                    } else if (this.src.startsWith('error')) {
                        this.complete = false;
                        this.onerror();
                    }
                }, 0);
            }
        } as unknown as typeof Image;
    })

    afterEach(() => {
        // 恢复原始 Image 构造函数
        global.Image = originalImage
        vi.clearAllMocks()
    })

    it('空数组时应立即返回空数组', async () => {
        await expect(preloadAndCacheImages([])).resolves.toEqual([])
    })

    it('成功加载多个图片', async () => {
        const urls = ['valid1.jpg', 'valid2.jpg']
        const result = await preloadAndCacheImages(urls)
        expect(result).toHaveLength(2)
        expect(result[0].src).toContain('valid1.jpg')
        expect(result[1].src).toContain('valid2.jpg')
    })

    it('单个图片加载失败时应拒绝整个 Promise', async () => {
        const urls = ['valid.jpg', 'error.jpg']
        await expect(preloadAndCacheImages(urls))
            .rejects
            .toThrow('图片加载失败: error.jpg')
    })

    it('混合成功和失败的情况应立即拒绝', async () => {
        const urls = ['error1.jpg', 'valid.jpg', 'error2.jpg']
        await expect(preloadAndCacheImages(urls))
            .rejects
            .toThrow('图片加载失败: error1.jpg') // 第一个错误会被捕获
    })

    it('处理多个错误情况', async () => {
        const urls = ['error1.jpg', 'error2.jpg']
        await expect(preloadAndCacheImages(urls))
            .rejects
            .toThrow('图片加载失败: error1.jpg')
    })
})



describe('preloadAndCacheImage 工具函数', () => {
    let originalImage: typeof Image;
    const mockImageLoad = vi.fn();
    const mockImageError = vi.fn();

    beforeEach(() => {
        // 保存原始 Image 构造函数
        originalImage = global.Image;

        // 模拟 Image 构造函数
        global.Image = class {
            src: string = '';
            onload: () => void = mockImageLoad;
            onerror: () => void = mockImageError;
            complete = false;
            naturalWidth = 100;

            constructor() {
                setTimeout(() => {
                    if (this.src === 'valid.jpg') {
                        this.complete = true;
                        this.onload();
                    } else if (this.src === 'error.jpg') {
                        this.onerror();
                    }
                }, 0);
            }
        } as unknown as typeof Image;
    });

    afterEach(() => {
        // 恢复原始 Image 构造函数
        global.Image = originalImage;
        vi.clearAllMocks();
    });

    test('成功加载图片', async () => {
        const result = await preloadAndCacheImage('valid.jpg');
        expect(result).toBeInstanceOf(Image);
        expect(result.src).toBe('valid.jpg');
        expect(result.complete).toBe(true);
    });

    test('处理图片加载失败', async () => {
        await expect(preloadAndCacheImage('error.jpg'))
            .rejects
            .toThrow('图片加载失败');
    });
});