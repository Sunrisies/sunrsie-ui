import { describe, it, expect } from 'vitest'
import { getRelativeTime } from '../common/index'

describe('getRelativeTime', () => {
  // 基本功能测试
  it('现在应该处理', () => {
    const now = new Date()
    expect(getRelativeTime(now, { now })).toBe('刚刚')
  })

  // 过去时间测试
  it('应该正确处理过去的事情', () => {
    const now = new Date('2024-01-01T12:00:00')

    // 秒级测试
    expect(getRelativeTime(
      new Date('2024-01-01T11:59:30'),
      { now }
    )).toBe('30秒前')

    // 分钟级测试
    expect(getRelativeTime(
      new Date('2024-01-01T11:58:00'),
      { now }
    )).toBe('2分钟前')

    // 小时级测试
    expect(getRelativeTime(
      new Date('2024-01-01T09:00:00'),
      { now }
    )).toBe('3小时前')

    // 天级测试
    expect(getRelativeTime(
      new Date('2023-12-29T12:00:00'),
      { now }
    )).toBe('3天前')

    // 周级测试
    expect(getRelativeTime(
      new Date('2023-12-15T12:00:00'),
      { now }
    )).toBe('2周前')

    // 月级测试
    expect(getRelativeTime(
      new Date('2023-10-01T12:00:00'),
      { now }
    )).toBe('3个月前')

    // 年级测试
    expect(getRelativeTime(
      new Date('2022-01-01T12:00:00'),
      { now }
    )).toBe('2年前')
  })

  // 未来时间测试
  it('应正确应对未来', () => {
    const now = new Date('2024-01-01T12:00:00')

    expect(getRelativeTime(
      new Date('2024-01-01T12:00:30'),
      { now }
    )).toBe('30秒后')

    expect(getRelativeTime(
      new Date('2024-01-01T12:02:00'),
      { now }
    )).toBe('2分钟后')
  })



  // 错误处理测试
  it('应处理无效输入', () => {
    expect(() => getRelativeTime('invalid date')).toThrow('无效的目标日期')
    expect(() => getRelativeTime(new Date(), {
      now: 'invalid date'
    })).toThrow('无效的当前日期')
  })

  // 边界值测试
  it('应处理边缘情况', () => {
    const now = new Date('2024-01-01T12:00:00')

    // 临界值测试
    expect(getRelativeTime(
      new Date('2024-01-01T11:59:56'),
      { now }
    )).toBe('4秒前')

    // 零值测试
    expect(getRelativeTime(now, { now })).toBe('刚刚')

    // 极大值测试
    const farFuture = new Date('2124-01-01T12:00:00')
    expect(getRelativeTime(farFuture, { now })).toBe('100年后')
  })

  // 本地化测试
  it('应该处理不同的地区', () => {
    const now = new Date('2024-01-01T12:00:00')

    // 英文
    expect(getRelativeTime(
      new Date('2024-01-01T11:59:00'),
      {
        now,
        locale: 'en-US',
      }
    )).toBe('1 minutes ago')
  })
})