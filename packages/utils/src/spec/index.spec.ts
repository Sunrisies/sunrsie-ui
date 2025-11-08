import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest';
import { getContentDimensions, conversionTime, genRandStr } from '../index';


describe('conversionTime 工具函数', () => {
    // 设置测试时区为北京时间
    process.env.TZ = 'Asia/Shanghai';

    test('转换常规时间戳', () => {
        // 2021-10-01 08:00:00 UTC+8 (时间戳1633046400)
        expect(conversionTime(1633046400)).toBe('2021年10月1日8时0分');
    });

    test('处理跨日时间', () => {
        // 2023-12-31 23:59:59 UTC+8 → 2024-01-01 07:59:59 UTC
        expect(conversionTime(1704038399)).toBe('2023年12月31日23时59分');
    });

    test('处理闰年日期', () => {
        // 2020-2-29 12:30:00 UTC+8 (时间戳1582943445)
        expect(conversionTime(1582950645)).toBe('2020年2月29日12时30分');
    });

    test('处理个位数时间单位', () => {
        // 2023-03-05 09:05:08 UTC+8
        expect(conversionTime(1677978308)).toBe('2023年3月5日9时5分');
    });

    test('处理零值时间戳', () => {
        // 1970-01-01 08:00:00 UTC+8
        expect(conversionTime(0)).toBe('1970年1月1日8时0分');
    });
});

// ... 已有其他测试用例 ...

describe('genRandStr 工具函数', () => {
    test('生成指定长度的随机字符串', () => {
        const result = genRandStr(10);
        expect(result).toHaveLength(10);
        expect(result).toMatch(/^[A-Za-z0-9]{10}$/);
    });

    test('处理零值输入', () => {
        const result = genRandStr(0);
        expect(result).toBeInstanceOf(Error);
        expect((result as unknown as Error).message).toBe('Length must be a positive number');
    });

    test('处理负数输入', () => {
        const result = genRandStr(-5);
        expect(result).toBeInstanceOf(Error);
    });

    test('处理非数字输入', () => {
        const result = genRandStr('invalid');
        expect(result).toBeInstanceOf(Error);
    });

    test('验证字符集完整性', () => {
        const result = genRandStr(1000);
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        // 验证生成的字符串只包含指定字符集的字符
        expect([...result].every(c => charset.includes(c))).toBe(true);
    });
});

describe('getContentDimensions', () => {
    // 创建测试用元素
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="testElement" style="
      display:block;
        width: 200px;
        height: 100px;
        padding: 10px 15px 20px 5px;
        box-sizing: border-box;
      ">11</div>
    `;
        // 手动设置 DOMRect 值
        const element = document.getElementById('testElement')!;
        vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            width: 200,
            height: 100,
            top: 0,
            left: 0,
            right: 200,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => null
        });
    });

    test('正确计算内容区域尺寸', () => {
        const result = getContentDimensions('testElement');
        if (result instanceof Error) throw result;
        // 验证计算结果
        // 总宽度 200px - 左右padding(5+15=20) = 180
        // 总高度 100px - 上下padding(10+20=30) = 70
        expect(result.width).toBeCloseTo(180);
        expect(result.height).toBeCloseTo(70);
    });

    test('元素不存在时返回错误', () => {
        const result = getContentDimensions('nonExistentElement');
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toContain('找不到id为');
    });

    test('无法获取计算样式时返回错误', () => {
        // 模拟无法获取计算样式的情况
        const element = document.getElementById('testElement')!;
        vi.spyOn(window, 'getComputedStyle').mockReturnValueOnce(null as any);

        const result = getContentDimensions('testElement');
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toContain('has no computed style');
    });
});