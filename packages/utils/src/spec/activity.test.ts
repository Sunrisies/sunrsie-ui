import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createActivityMonitor } from '../common/activity'

describe('createActivityMonitor', () => {
  beforeEach(() => {
    // 模拟 window.setTimeout 和 clearTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    // 清理定时器模拟
    vi.restoreAllMocks()
  })

  it('应该创建一个活动监控器实例', () => {
    const monitor = createActivityMonitor({
      timeout: 1000,
      onTimeout: vi.fn()
    })

    expect(monitor).toHaveProperty('check')
    expect(monitor).toHaveProperty('start')
    expect(monitor).toHaveProperty('stop')
    expect(monitor).toHaveProperty('pause')
    expect(monitor).toHaveProperty('resume')
    expect(monitor).toHaveProperty('getState')
  })

  it('应该在超时时调用回调函数', () => {
    const onTimeout = vi.fn()
    const monitor = createActivityMonitor({
      timeout: 1000,
      onTimeout
    })

    monitor.start()
    expect(onTimeout).not.toHaveBeenCalled()

    // 前进 1000ms
    vi.advanceTimersByTime(1000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('应该正确跟踪活动状态', () => {
    const monitor = createActivityMonitor({
      timeout: 1000,
      onTimeout: vi.fn()
    })

    // 初始状态
    expect(monitor.getState()).toEqual({
      isActive: false,
      remainingTime: 0,
      elapsedTime: 0
    })

    // 启动后的状态
    monitor.start()
    expect(monitor.getState().isActive).toBe(true)
    expect(monitor.getState().remainingTime).toBeGreaterThan(0)
    expect(monitor.getState().elapsedTime).toBeGreaterThanOrEqual(0)
  })

  it('应该支持自动启动', () => {
    const onStart = vi.fn()
    createActivityMonitor({
      timeout: 1000,
      onTimeout: vi.fn(),
      onStart,
      autoStart: true
    })

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('应该支持暂停和恢复', () => {
    const onTimeout = vi.fn()
    const monitor = createActivityMonitor({
      timeout: 1000,
      onTimeout
    })

    monitor.start()
    monitor.pause()

    // 暂停后超时不应触发
    vi.advanceTimersByTime(1000)
    expect(onTimeout).not.toHaveBeenCalled()

    // 恢复后应重新开始计时
    monitor.resume()
    vi.advanceTimersByTime(1000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('应该在检测到活动时重置计时器', () => {
    const onTimeout = vi.fn()
    const onActivity = vi.fn()
    const monitor = createActivityMonitor({
      timeout: 1000,
      onTimeout,
      onActivity
    })

    // 直接使用 check() 启动，而不是 start()
    monitor.check()
    expect(onActivity).toHaveBeenCalledTimes(1)

    // 前进 900ms，不应超时
    vi.advanceTimersByTime(900)
    expect(onTimeout).not.toHaveBeenCalled()

    // 再前进 100ms，应该超时
    vi.advanceTimersByTime(100)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('应该在停止时清理状态', () => {
    const onStop = vi.fn()
    const monitor = createActivityMonitor({
      timeout: 1000,
      onTimeout: vi.fn(),
      onStop
    })

    monitor.start()
    monitor.stop()

    expect(onStop).toHaveBeenCalledTimes(1)
    expect(monitor.getState()).toEqual({
      isActive: false,
      remainingTime: 0,
      elapsedTime: 0
    })
  })
})