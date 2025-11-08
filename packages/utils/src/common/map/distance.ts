import { getCenterLonLat } from "./coordinates"
import { rad2deg } from "./mathUtils"
import { Point } from "./types"

/**
 * 计算两个经纬度之间的距离，并返回中心点经纬度。
 * @public
 *
 * @param lat1 - 第一个点的纬度（-90 到 90 之间）
 * @param lon1 - 第一个点的经度（-180 到 180 之间）
 * @param lat2 - 第二个点的纬度（-90 到 90 之间）
 * @param lon2 - 第二个点的经度（-180 到 180 之间）
 * @returns 包含中心点坐标和距离的对象
 *
 * @example
 * ```typescript
 * // 计算北京到上海的经纬度距离
 * const result = distanceLngLat(39.9042, 116.4074, 31.2304, 121.4737);
 * console.log('中心点:', result.lon, result.lat);
 * console.log('距离:', result.distance + '米'); 
 * ```
 */
export function distanceLngLat(lat1: number, lon1: number, lat2: number, lon2: number): Point {
    // 校验纬度范围
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        throw new Error('纬度必须在 -90 到 90 之间')
    }

    // 校验经度范围
    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        throw new Error('经度必须在 -180 到 180 之间')
    }

    const radLat1 = rad2deg(lat1)
    const radLat2 = rad2deg(lat2)
    const a = radLat1 - radLat2
    const b = rad2deg(lon1) - rad2deg(lon2)
    const s =
        2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
    const earthRadius = 6378137.0 // WGS84标准参考椭球中的地球长半径(单位:m)
    const distance = s * earthRadius
    const centerLonLat = getCenterLonLat(lon1, lat1, lon2, lat2)
    return { lon: centerLonLat[0], lat: centerLonLat[1], distance: Math.round(distance * 10000) / 10000 }
}