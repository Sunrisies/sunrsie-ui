import { getCenterLonLat } from "./coordinates";
import { rad2deg } from "./mathUtils";
import { Point } from "./types";

/**
 * 计算两个经纬度点之间的距离和中心点坐标
 * @description 使用球面距离公式（Haversine公式）计算两点间距离，并计算中心点坐标
 * @public
 * @func 计算经纬度距离
 * @memberof module:map/distance
 *
 * @param lat1 - 第一个点的纬度（-90 到 90 之间）
 * @param lon1 - 第一个点的经度（-180 到 180 之间）
 * @param lat2 - 第二个点的纬度（-90 到 90 之间）
 * @param lon2 - 第二个点的经度（-180 到 180 之间）
 * @returns {Point} 包含中心点坐标和距离的对象
 * @returns {number} returns.lon - 中心点经度
 * @returns {number} returns.lat - 中心点纬度
 * @returns {number} returns.distance - 两点间距离（米），保留4位小数
 *
 * @throws {Error} 当经纬度超出有效范围时抛出错误
 *
 * @example
 * ```typescript
 * // 计算北京到上海的距离和中心点
 * const result = distanceLngLat(39.9042, 116.4074, 31.2304, 121.4737);
 * console.log('中心点经度:', result.lon);  // 中心点经度
 * console.log('中心点纬度:', result.lat);  // 中心点纬度
 * console.log('距离:', result.distance + '米');  // 距离（米）
 *
 * // 处理错误情况
 * try {
 *   distanceLngLat(91, 0, 0, 0);  // 纬度超出范围
 * } catch (error) {
 *   console.error(error.message);  // "纬度必须在 -90 到 90 之间"
 * }
 * ```
 */
export function distanceLngLat(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Point {
  // 校验纬度范围
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error("纬度必须在 -90 到 90 之间");
  }

  // 校验经度范围
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    throw new Error("经度必须在 -180 到 180 之间");
  }

  // 将角度转换为弧度
  const radLat1 = rad2deg(lat1);
  const radLat2 = rad2deg(lat2);

  // 计算经纬度差值
  const a = radLat1 - radLat2;
  const b = rad2deg(lon1) - rad2deg(lon2);

  // 使用Haversine公式计算球面距离
  const s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    );

  // WGS84标准参考椭球中的地球长半径(单位:m)
  const earthRadius = 6378137.0;

  // 计算实际距离
  const distance = s * earthRadius;

  // 计算中心点坐标
  const centerLonLat = getCenterLonLat(lon1, lat1, lon2, lat2);

  // 返回结果，距离保留4位小数
  return {
    lon: centerLonLat[0],
    lat: centerLonLat[1],
    distance: Math.round(distance * 10000) / 10000,
  };
}
