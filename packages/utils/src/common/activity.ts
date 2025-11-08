/**
 * 活动监控器配置选项
 * @public
 */
export interface ActivityMonitorOptions {
  /** 超时时间（毫秒） */
  timeout: number
  /** 超时回调函数 */
  onTimeout: () => void
  /** 检测到活动时的回调函数 */
  onActivity?: () => void
  /** 首次启动时的回调函数 */
  onStart?: () => void
  /** 停止监控时的回调函数 */
  onStop?: () => void
  /** 是否自动启动监控 */
  autoStart?: boolean
  /** 是否在窗口失去焦点时暂停监控 */
  pauseOnBlur?: boolean
  /** 是否在窗口获得焦点时恢复监控 */
  resumeOnFocus?: boolean
}

/**
 * 活动监控器状态
 * @public
 */
export interface ActivityMonitorState {
  /** 是否处于活动状态 */
  isActive: boolean
  /** 剩余时间（毫秒） */
  remainingTime: number
  /** 已运行时间（毫秒） */
  elapsedTime: number
}

/**
 * 活动监控器
 * @public
 * 
 * @remarks
 * 用于监控用户活动状态，可以设置超时时间和各种回调函数。
 * 支持自动启动、暂停恢复等功能，适用于会话超时、屏保等场景。
 * 
 * @example
 * ```typescript
 * // 基本用法
 * const monitor = createActivityMonitor({
 *   timeout: 5000,
 *   onTimeout: () => console.log('超时'),
 *   onActivity: () => console.log('检测到活动')
 * });
 * 
 * // 启动监控
 * monitor.start();
 * 
 * // 手动触发活动检查
 * monitor.check();
 * 
 * // 停止监控
 * monitor.stop();
 * ```
 */
export function createActivityMonitor(options: ActivityMonitorOptions) {
  let timer: number | null = null
  let isActive = false
  let startTime = 0
  let lastActivityTime = 0

  // 默认配置
  const config = {
    autoStart: false,
    pauseOnBlur: true,
    resumeOnFocus: true,
    ...options
  }

  /**
   * 获取当前状态
   */
  const getState = (): ActivityMonitorState => ({
    isActive,
    remainingTime: timer ? config.timeout - (Date.now() - lastActivityTime) : 0,
    elapsedTime: startTime ? Date.now() - startTime : 0
  })

  /**
   * 检查活动状态
   */
  const check = () => {
    if (timer) clearTimeout(timer)

    const now = Date.now()
    lastActivityTime = now

    // 首次触发启动回调
    if (!isActive) {
      isActive = true
      startTime = now
      config.onStart?.()
    }

    // 每次活动触发回调
    config.onActivity?.()

    // 设置超时检测
    timer = window.setTimeout(() => {
      config.onTimeout()
      isActive = false
      startTime = 0
    }, config.timeout) as unknown as number
  }

  /**
   * 停止监控
   */
  const stop = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (isActive) {
      isActive = false
      config.onStop?.()
    }
    startTime = 0
  }

  /**
   * 启动监控
   */
  const start = () => {
    if (!isActive) {
      check()
    }
  }

  /**
   * 暂停监控
   */
  const pause = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  /**
   * 恢复监控
   */
  const resume = () => {
    if (isActive) {
      check()
    }
  }

  // 自动启动
  if (config.autoStart) {
    start()
  }

  return {
    check,
    start,
    stop,
    pause,
    resume,
    getState
  }
}