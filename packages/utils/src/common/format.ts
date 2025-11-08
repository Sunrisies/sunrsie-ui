/**
 * 文件大小格式化工具
 * @public
 * 
 * @remarks
 * 智能格式化文件大小，支持以下特性：
 * - 支持二进制（1024）和十进制（1000）计算方式
 * - 支持国际化数字和单位显示
 * - 智能处理数字精度
 * - 支持自定义单位系统
 * - 处理极限值和边界情况
 * 
 * @param bytes - 文件大小（字节数）
 * @param options - 格式化配置选项
 * @param options.base - 进制基数（1024为二进制，1000为十进制）
 * @param options.digits - 小数位数（null为自动判断）
 * @param options.locale - 数字本地化设置
 * @param options.units - 自定义单位数组
 * @param options.useIECUnits - 是否使用IEC标准单位（KiB等）
 * @param options.errorMessages - 错误信息本地化配置
 * 
 * @returns 格式化后的文件大小字符串
 * @throws {TypeError} 当输入参数无效时抛出
 * @throws {RangeError} 当输入值超出范围时抛出
 * 
 * @example
 * ```typescript
 * // 基本用法
 * formatBytes(1024) // "1 KB"
 * 
 * // 使用二进制单位
 * formatBytes(1024, { base: 1024, useIECUnits: true }) // "1 KiB"
 * 
 * // 本地化显示（中文）
 * formatBytes(1024, { 
 *   locale: 'zh-CN',
 *   units: ['字节', 'KB', 'MB', 'GB'],
 *   errorMessages: {
 *     invalidNumber: '必须传入有效数字',
 *     negativeValue: '文件大小不能为负数'
 *   }
 * }) // "1 KB"
 * 
 * // 自定义精度
 * formatBytes(1234, { digits: 2 }) // "1.21 KB"
 * ```
 */
export function formatBytes(
    bytes: number,
    options?: {
        base?: 1024 | 1000
        digits?: number | null
        locale?: string | string[]
        units?: string[]
        useIECUnits?: boolean
        errorMessages?: {
            invalidNumber?: string
            negativeValue?: string
        }
    }
): string {
    // 默认错误消息
    const defaultErrorMessages = {
        invalidNumber: 'Invalid number provided',
        negativeValue: 'File size cannot be negative'
    }

    // 合并配置项
    const {
        base = 1024,
        digits = null,
        locale = 'en',
        units = [],
        useIECUnits = false,
        errorMessages = defaultErrorMessages
    } = options || {}
    if (typeof bytes !== 'number' || isNaN(bytes) || !isFinite(bytes)) {
        throw new TypeError(errorMessages.invalidNumber || defaultErrorMessages.invalidNumber)
    }
    // 参数校验
    if (typeof bytes !== 'number' || isNaN(bytes)) {
        throw new TypeError(errorMessages.invalidNumber || defaultErrorMessages.invalidNumber)
    }
    if (bytes < 0) {
        throw new RangeError(errorMessages.negativeValue || defaultErrorMessages.negativeValue)
    }

    // 处理极限值
    if (bytes === 0) {
        return `0 ${units.length > 0 ? units[0] : (useIECUnits ? 'Bytes' : 'B')}`
    }

    // 准备单位体系
    const defaultUnits = useIECUnits
        ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
        : ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const unitList = units.length > 0
        ? [...units]
        : [...defaultUnits]

    // 计算合适单位
    let unitIndex = 0
    let size = Math.abs(bytes)

    // 防止超出最大单位
    const maxUnitIndex = unitList.length - 1
    while (size >= base && unitIndex < maxUnitIndex) {
        size /= base
        unitIndex++
    }

    // 智能确定小数位数
    const precision = typeof digits === 'number'
        ? digits
        : size >= 100 || (size % 1 === 0)  // 添加整数判断
            ? 0
            : 2


    // 本地化数字格式
    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    }).format(size)

    return `${formatted} ${unitList[unitIndex]}`
}