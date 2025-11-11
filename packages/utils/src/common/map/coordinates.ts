/**
 * 计算两个经纬度之间的中心经纬度。
 * @public
 *
 * @memberof module:map/getCenterLonLat
 *
 * @func 计算两个经纬度之间的中心经纬度。
 *
 * @param oneLon - 第一个点的经度（-180 到 180 之间）
 * @param oneLat - 第一个点的纬度（-90 到 90 之间）
 * @param twoLon - 第二个点的经度（-180 到 180 之间）
 * @param twoLat - 第二个点的纬度（-90 到 90 之间）
 * @returns 中心点的经纬度数组 [经度, 纬度]
 *
 * @example
 * ```typescript
 * // 计算北京和上海之间的中心点
 * const center = getCenterLonLat(116.4074, 39.9042, 121.4737, 31.2304);
 * console.log('中心点经纬度:', center); // 输出 [118.94055, 35.5673]
 * ```
 */
export function getCenterLonLat(
  oneLon: number,
  oneLat: number,
  twoLon: number,
  twoLat: number
): [number, number] {
  // 校验经度范围
  if (oneLon < -180 || oneLon > 180 || twoLon < -180 || twoLon > 180) {
    throw new Error("经度必须在 -180 到 180 之间");
  }

  // 校验纬度范围
  if (oneLat < -90 || oneLat > 90 || twoLat < -90 || twoLat > 90) {
    throw new Error("纬度必须在 -90 到 90 之间");
  }
  const centerLon = (oneLon + twoLon) / 2;
  const centerLat = (oneLat + twoLat) / 2;
  return [centerLon, centerLat];
}
