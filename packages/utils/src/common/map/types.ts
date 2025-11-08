
/**
 * 表示地理坐标点及其关联距离的类型
 * @public
 *
 * @remarks
 * 该类型用于存储具有经度、纬度坐标和关联距离值的点数据，
 * 常见于地理空间计算场景
 */
export type Point = {
    /** 纬度坐标（-90 到 90 之间） */
    lat: number
    /** 经度坐标（-180 到 180 之间） */
    lon: number
    /** 关联的距离值（单位：米） */
    distance: number
}