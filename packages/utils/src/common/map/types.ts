/**
 * 地理坐标点类型定义
 * @description 定义包含经纬度坐标和距离值的地理点数据结构
 * @public
 * @func 地理坐标点类型
 * @memberof module:map/types
 *
 * @remarks
 * 该类型用于存储具有经度、纬度坐标和关联距离值的点数据，
 * 常见于以下场景：
 * - 地理空间计算
 * - 位置服务
 * - 距离测量
 * - 区域分析
 *
 * @example
 * ```typescript
 * // 创建一个坐标点
 * const point: Point = {
 *   lat: 39.9042,    // 北京纬度
 *   lon: 116.4074,   // 北京经度
 *   distance: 1000   // 1公里
 * };
 *
 * // 在函数中使用
 * function calculateDistance(point: Point) {
 *   // 计算逻辑
 * }
 * ```
 */
export type Point = {
  /**
   * 纬度坐标
   * @description 地理坐标系中的纬度值
   * @remarks
   * - 范围必须在 -90 到 90 度之间
   * - 负值表示南纬
   * - 正值表示北纬
   * @example 39.9042 // 北京纬度
   */
  lat: number;

  /**
   * 经度坐标
   * @description 地理坐标系中的经度值
   * @remarks
   * - 范围必须在 -180 到 180 度之间
   * - 负值表示西经
   * - 正值表示东经
   * @example 116.4074 // 北京经度
   */
  lon: number;

  /**
   * 距离值
   * @description 与该点关联的距离信息
   * @remarks
   * - 单位为米
   * - 可用于表示搜索半径、缓冲区距离等
   * @example 1000 // 表示1公里
   */
  distance: number;
};
