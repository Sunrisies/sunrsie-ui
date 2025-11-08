import { deg2rad, rad2deg } from "./mathUtils"
import { Point } from "./types"

/**
 * 计算以给定点为中心，在四个方向扩展指定距离的新坐标点
 * @public
 *
 * @param centerPoint - 包含中心点经纬度和距离的对象
 * @returns 四个新点的经纬度坐标数组，按顺时针方向排列
 *
 * @example
 * ```typescript
 * // 在中心点周围生成四个坐标点
 * const newPoints = calculateNewPoints({
 *   lon: 113.5930592,
 *   lat: 33.4148429,
 *   distance: 1
 * });
 * console.log(newPoints); // 输出四个坐标数组
 * ```
 */
export const calculateNewPoints = ({ lat, lon, distance }: Point): Array<[number, number]> => {
    // 校验经度范围
    if (lon < -180 || lon > 180) {
        throw new Error('经度必须在 -180 到 180 之间')
    }

    // 校验纬度范围
    if (lat < -90 || lat > 90) {
        throw new Error('纬度必须在 -90 到 90 之间')
    }
    const R = 6371e3
    const d = distance / R
    const latRad = deg2rad(lat)
    const lonRad = deg2rad(lon)
    const newPoints: Array<[number, number]> = []
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2
        const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(angle))
        const newLonRad =
            lonRad + Math.atan2(Math.sin(angle) * Math.sin(d) * Math.cos(latRad), Math.cos(d) - Math.sin(latRad) * Math.sin(newLatRad))

        newPoints.push([rad2deg(newLonRad), rad2deg(newLatRad)])
    }
    return newPoints
}