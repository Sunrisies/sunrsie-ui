/**
 * 相对时间配置选项
 */
export interface RelativeTimeOptions {
  /** 当前时间参考点，默认为当前时间 */
  now?: Date | number | string
  /** 语言设置，默认为 'zh-CN'，支持 'zh-CN' | 'en-US' */
  locale?: 'zh-CN' | 'en-US'
  /** 自定义文案配置对象，如果提供则覆盖默认的语言文案 */
  messages?: {
    justNow?: string
    seconds?: string
    minutes?: string
    hours?: string
    days?: string
    weeks?: string
    months?: string
    years?: string
    future?: string
    past?: string
  }
}

// 默认语言配置
const DEFAULT_MESSAGES = {
  'zh-CN': {
    justNow: '刚刚',
    seconds: '{count}秒',
    minutes: '{count}分钟',
    hours: '{count}小时',
    days: '{count}天',
    weeks: '{count}周',
    months: '{count}个月',
    years: '{count}年',
    future: '{time}后',
    past: '{time}前'
  },
  'en-US': {
    justNow: 'just now',
    seconds: '{count} seconds',
    minutes: '{count} minutes',
    hours: '{count} hours',
    days: '{count} days',
    weeks: '{count} weeks',
    months: '{count} months',
    years: '{count} years',
    future: 'in {time}',
    past: '{time} ago'
  }
} as const

/**
 * 相对时间描述工具
 * @public
 * 
 * @remarks
 * 智能格式化相对时间，支持以下特性：
 * - 支持多种时间单位（秒、分、时、天、周、月、年）
 * - 支持中英文国际化显示
 * - 支持未来时间和过去时间
 * - 支持自定义文案
 * 
 * @param date - 目标日期或时间戳
 * @param options - 格式化配置选项对象
 * @returns 格式化后的相对时间描述字符串
 * @throws {TypeError} 当输入的日期参数无效时抛出
 * 
 * @example
 * ```typescript
 * // 基本用法（中文）
 * getRelativeTime(new Date("2024-01-01")); // "x天前"
 * 
 * // 英文显示
 * getRelativeTime(date, { locale: "en-US" }); // "x days ago"
 * 
 * // 自定义文案（会覆盖默认语言设置）
 * getRelativeTime(date, {
 *   messages: {
 *     minutes: "{count} mins",
 *     past: "{time} before"
 *   }
 * });
 * ```
 */
export function getRelativeTime(
  date: Date | number | string,
  options?: RelativeTimeOptions
): string {
  // 参数处理和默认值
  const {
    now = new Date(),
    locale = 'zh-CN',
    messages = DEFAULT_MESSAGES[locale as keyof typeof DEFAULT_MESSAGES]
  } = options || {}

  // 转换日期对象
  const targetDate = new Date(date)
  const currentDate = new Date(now)

  // 参数验证
  if (isNaN(targetDate.getTime())) {
    throw new TypeError('无效的目标日期')
  }
  if (isNaN(currentDate.getTime())) {
    throw new TypeError('无效的当前日期')
  }

  // 计算时间差（毫秒）
  const diff = targetDate.getTime() - currentDate.getTime()
  const absDiff = Math.abs(diff)
  const isFuture = diff > 0

  // 时间单位换算（毫秒）
  const SECOND = 1000
  const MINUTE = SECOND * 60
  const HOUR = MINUTE * 60
  const DAY = HOUR * 24
  const WEEK = DAY * 7
  const MONTH = DAY * 30
  const YEAR = DAY * 365

  // 计算相对时间
  let value: number
  let unit: keyof typeof messages = 'justNow'  // 设置默认值并明确类型

  if (absDiff < SECOND * 3) {  // 3秒内显示"刚刚"
    return messages.justNow!
  } else if (absDiff < MINUTE) {  // 小于1分钟显示秒数
    value = Math.floor(absDiff / SECOND)
    unit = 'seconds' as keyof typeof messages
  } else if (absDiff < HOUR) {  // 小于1小时显示分钟
    value = Math.floor(absDiff / MINUTE)
    unit = 'minutes' as keyof typeof messages
  } else if (absDiff < DAY) {  // 小于1天显示小时
    value = Math.floor(absDiff / HOUR)
    unit = 'hours' as keyof typeof messages
  } else if (absDiff < WEEK) {  // 小于1周显示天数
    value = Math.floor(absDiff / DAY)
    unit = 'days' as keyof typeof messages
  } else if (absDiff < MONTH) {  // 小于1月显示周数
    value = Math.floor(absDiff / WEEK)
    unit = 'weeks' as keyof typeof messages
  } else if (absDiff < YEAR) {  // 小于1年显示月数
    value = Math.floor(absDiff / MONTH)
    unit = 'months' as keyof typeof messages
  } else {  // 大于等于1年显示年数
    value = Math.floor(absDiff / YEAR)
    unit = 'years' as keyof typeof messages
  }

  // 格式化输出
  const timeText = messages[unit]?.replace('{count}', value.toString()) ?? `${value}`
  return isFuture
    ? messages.future?.replace('{time}', timeText) ?? timeText
    : messages.past?.replace('{time}', timeText) ?? timeText
}