import { describe, it, expect } from 'vitest'
import { formatBytes } from '../common/index'

describe('formatBytes', () => {
    // 基本功能测试
    it('应正确格式化基本字节值', () => {
        expect(formatBytes(0)).toBe('0 B')
        expect(formatBytes(1024)).toBe('1 KB')
        expect(formatBytes(1234567)).toBe('1.18 MB')
    })

    // 二进制单位测试
    it('应正确处理IEC二进制单位', () => {
        expect(formatBytes(1024, { useIECUnits: true })).toBe('1 KiB')
        expect(formatBytes(1048576, { useIECUnits: true })).toBe('1 MiB')
    })

    // 十进制基数测试
    it('应正确处理十进制基数', () => {
        expect(formatBytes(1000, { base: 1000 })).toBe('1 KB')
        expect(formatBytes(1000000, { base: 1000 })).toBe('1 MB')
    })

    // 本地化测试
    it('应正确处理本地化', () => {
        expect(formatBytes(1234.56, { locale: 'de-DE' })).toBe('1,21 KB')
        expect(formatBytes(1234.56, { locale: 'zh-CN' })).toBe('1.21 KB')
    })

    // 自定义单位测试
    it('应正确处理自定义单位', () => {
        const customUnits = ['字节', 'KB', 'MB', 'GB']
        expect(formatBytes(1024, { units: customUnits })).toBe('1 KB')
        expect(formatBytes(0, { units: customUnits })).toBe('0 字节')
    })

    // 精度控制测试
    it('应正确处理精度', () => {
        expect(formatBytes(1234, { digits: 2 })).toBe('1.21 KB')
        expect(formatBytes(1234, { digits: 0 })).toBe('1 KB')
    })

    // 错误处理测试
    it('应正确处理错误', () => {
        // 无效输入
        expect(() => formatBytes(NaN)).toThrow(TypeError)
        expect(() => formatBytes(Number.POSITIVE_INFINITY)).toThrow(TypeError)

        // 负值
        expect(() => formatBytes(-1)).toThrow(RangeError)

        // 自定义错误消息
        const errorMessages = {
            invalidNumber: '无效数字',
            negativeValue: '不能为负数'
        }
        expect(() => formatBytes(NaN, { errorMessages }))
            .toThrow(errorMessages.invalidNumber)
    })

    // 边界值测试
    it('应正确处理边缘情况', () => {
        // 极大值
        expect(formatBytes(Number.MAX_SAFE_INTEGER)).toMatch(/^[\d,.]+ [KMGTPEZY]B$/)

        // 极小值
        expect(formatBytes(0.1)).toBe('0.10 B')

        // 接近单位边界值
        expect(formatBytes(1023)).toBe('1,023 B')
        expect(formatBytes(1024)).toBe('1 KB')
    })
})