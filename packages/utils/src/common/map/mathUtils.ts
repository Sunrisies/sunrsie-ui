/**
 * 角度转弧度工具函数
 * @description 将角度值转换为弧度值
 * @public
 * @func 角度转弧度
 * @memberof module:math/angle
 *
 * @param deg - 角度值，范围不限
 * @returns {number} 对应的弧度值，范围在 -π 到 π 之间
 *
 * @example
 * ```typescript
 * // 转换直角
 * deg2rad(90) // Math.PI / 2
 *
 * // 转换平角
 * deg2rad(180) // Math.PI
 *
 * // 转换负角度
 * deg2rad(-45) // -Math.PI / 4
 * ```
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * 弧度转角度工具函数
 * @description 将弧度值转换为角度值
 * @public
 * @func 弧度转角度
 * @memberof module:math/angle
 *
 * @param rad - 需要转换的弧度值，范围不限
 * @returns {number} 对应的角度值，范围不限
 *
 * @example
 * ```typescript
 * // 转换π/2
 * rad2deg(Math.PI / 2) // 90
 *
 * // 转换π
 * rad2deg(Math.PI) // 180
 *
 * // 转换负弧度
 * rad2deg(-Math.PI / 4) // -45
 * ```
 */
export function rad2deg(rad: number): number {
  return rad * (180 / Math.PI);
}
