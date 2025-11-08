/**
 * 将角度转换为弧度。
 *
 * @param rad - 角度值。
 * @returns 对应的弧度。
 */
export function deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
}

/**
 * 将弧度转换为角度
 * @private
 * 
 * @param rad - 需要转换的弧度值
 * @returns 对应的角度值
 */
export function rad2deg(rad: number): number {
    return rad * (180 / Math.PI)
}