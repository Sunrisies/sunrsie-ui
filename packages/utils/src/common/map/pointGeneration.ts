import { deg2rad, rad2deg } from "./mathUtils";
import { Point } from "./types";

/**
 * 计算以给定点为中心，在四个方向扩展指定距离的新坐标点
 * @description 使用球面三角学计算以中心点为原点，在正东、正南、正西、正北四个方向上指定距离处的坐标点
 * @public
 * @func 计算四向坐标点
 * @memberof module:map/calculatenewpoints
 *
 * @param centerPoint - 包含中心点经纬度和距离的对象
 * @param centerPoint.lat - 中心点纬度（-90 到 90 之间）
 * @param centerPoint.lon - 中心点经度（-180 到 180 之间）
 * @param centerPoint.distance - 扩展距离（米）
 * @returns {Array<[number, number]>} 四个新点的经纬度坐标数组，按顺时针方向（东、南、西、北）排列
 * @returns {number} returns[][0] - 经度
 * @returns {number} returns[][1] - 纬度
 *
 * @throws {Error} 当经纬度超出有效范围时抛出错误
 *
 * @example
 * ```typescript
 * // 在中心点周围生成四个坐标点
 * const newPoints = calculateNewPoints({
 *   lon: 113.5930592,
 *   lat: 33.4148429,
 *   distance: 1000  // 1公里
 * });
 *
 * // 输出示例
 * // [
 * //   [113.6030592, 33.4148429],  // 东
 * //   [113.5930592, 33.4048429],  // 南
 * //   [113.5830592, 33.4148429],  // 西
 * //   [113.5930592, 33.4248429]   // 北
 * // ]
 *
 * // 处理错误情况
 * try {
 *   calculateNewPoints({ lat: 91, lon: 0, distance: 1000 });
 * } catch (error) {
 *   console.error(error.message); // "纬度必须在 -90 到 90 之间"
 * }
 * ```
 */
export function calculateNewPoints({
  lat,
  lon,
  distance,
}: Point): Array<[number, number]> {
  // 校验经度范围
  if (lon < -180 || lon > 180) {
    throw new Error("经度必须在 -180 到 180 之间");
  }

  // 校验纬度范围
  if (lat < -90 || lat > 90) {
    throw new Error("纬度必须在 -90 到 90 之间");
  }

  // 地球平均半径（米）
  const R = 6371e3;

  // 将距离转换为弧度
  const d = distance / R;

  // 将中心点坐标转换为弧度
  const latRad = deg2rad(lat);
  const lonRad = deg2rad(lon);

  // 存储计算结果
  const newPoints: Array<[number, number]> = [];

  // 计算四个方向的坐标点
  for (let i = 0; i < 4; i++) {
    // 计算方向角（0: 东, π/2: 南, π: 西, 3π/2: 北）
    const angle = (i * Math.PI) / 2;

    // 使用球面三角学公式计算新坐标
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(d) +
        Math.cos(latRad) * Math.sin(d) * Math.cos(angle)
    );

    const newLonRad =
      lonRad +
      Math.atan2(
        Math.sin(angle) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(newLatRad)
      );

    // 将弧度转换回角度并添加到结果数组
    newPoints.push([rad2deg(newLonRad), rad2deg(newLatRad)]);
  }

  return newPoints;
}
