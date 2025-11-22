import { Cartesian3, Cartographic, HeadingPitchRoll, Matrix4, Model, sampleTerrain, Transforms, Viewer, Math, Rectangle, Cartesian2, defined } from "cesium"
import { calculateLocationType, findModelByIdType } from "./types"
/**
 * 计算位置矩阵，根据传入的经纬度和地形数据获取新的位置矩阵
 * @public
 * @author 朝阳
 * @version 1.0.0
 * @param {calculateLocationType} params - 包含计算位置矩阵所需参数的对象
 * @param {number} params.longitude - 经度值，范围：-180 到 180
 * @param {number} params.latitude - 纬度值，范围：-90 到 90
 * @param {number} [params.heading=0] - 方位角（度），默认值为 0，表示正北方向
 * @param {CesiumTerrainProvider} params.terrainProvider - Cesium 地形提供者，用于获取地形高度数据
 * @returns {Promise<Matrix4>} 返回一个 4x4 变换矩阵，可用于定位和旋转 3D 对象
 * @throws {Error} 当地形采样失败或坐标转换出错时抛出错误
 * 
 * @memberof module:cesium/utils
 * 
 * @func 计算位置矩阵
 * @example
 * ```typescript
 * // 创建地形提供者
 * const terrainProvider = await Cesium.createWorldTerrain();
 * 
 * // 计算北京天安门的位置矩阵
 * const matrix = await calculateLocationMatrix({
 *   longitude: 116.3974,
 *   latitude: 39.9093,
 *   heading: 45, // 东北方向
 *   terrainProvider
 * });
 * 
 * // 将矩阵应用到模型
 * model.modelMatrix = matrix;
 * ```
 */
export const calculateLocationMatrix = async ({
    longitude,
    latitude,
    heading = 0,
    terrainProvider
}: calculateLocationType): Promise<Matrix4> => {
    try {
        const positions = [Cartographic.fromDegrees(longitude, latitude)]
        const result = await sampleTerrain(terrainProvider, 11, positions)
        const height = result[0].height
        console.log(height)
        const origin = Cartesian3.fromDegrees(longitude, latitude, 2)
        const hpr = HeadingPitchRoll.fromDegrees(heading, 0, 0)
        const matrix = Transforms.headingPitchRollToFixedFrame(origin, hpr)
        return matrix
    } catch (error) {
        console.error('An error occurred while calculating the location matrix:', error)
        throw error
    }
}


/**
 * 根据模型ID在场景中查找对应的模型实例
 * @public
 * @author 朝阳
 * @version 1.0.0
 * 
 * @param {findModelByIdType} params - 包含查找模型所需参数的对象
 * @param {Viewer} params.viewer - Cesium 场景查看器实例，用于访问场景中的模型
 * @param {string} params.id - 要查找的模型的唯一标识符
 * @returns {Model | null} 如果找到匹配的模型，则返回该模型实例；否则返回 null
 * @memberof module:cesium/utils
 * 
 * @func 根据ID查找模型
 * @example
 * ```typescript
 * // 初始化查看器
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * 
 * // 添加模型到场景
 * const model = await Cesium.Model.fromGltfAsync({
 *   url: './assets/models/aircraft.glb',
 *   id: 'my-aircraft'
 * });
 * viewer.scene.primitives.add(model);
 * 
 * // 通过ID查找模型
 * const foundModel = findModelById({
 *   viewer: viewer,
 *   id: 'my-aircraft'
 * });
 * 
 * if (foundModel) {
 *   console.log('找到模型:', foundModel);
 *   // 对模型进行操作...
 * }
 * ```
 */
export function findModelById({ viewer, id }: findModelByIdType): Model | null {
    const primitives = viewer.scene.primitives
    for (let i = 0; i < primitives.length; ++i) {
        const primitive = primitives.get(i)
        if (primitive instanceof Model && primitive.id === id) {
            return primitive
        }
    }
    return null
}

/**
 * 控制相机飞行到指定位置
 * @public
 * @author 朝阳
 * @version 1.0.0
 * 
 * @param {Viewer} map - Cesium 地图查看器实例
 * @param {Cartesian3 | Rectangle} position - 目标位置，可以是笛卡尔坐标点或矩形区域
 * @returns {void} 无返回值
 * @memberof module:cesium/utils
 * 
 * @func 相机飞行到指定位置
 * @example
 * ```typescript
 * // 初始化查看器
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * 
 * // 飞行到指定笛卡尔坐标点
 * const targetPosition = Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000);
 * flyTo(viewer, targetPosition);
 * 
 * // 飞行到指定矩形区域
 * const rectangle = Cesium.Rectangle.fromDegrees(116.3, 39.8, 116.5, 40.0);
 * flyTo(viewer, rectangle);
 * ```
 */
export function flyTo(map: Viewer, position: Cartesian3 | Rectangle) {
    console.log(position, map)
    map.camera.flyTo({
        destination: position,
        orientation: {
            heading: Math.toRadians(0),
            pitch: Math.toRadians(-90),
            roll: 0.0
        }
    })
}


/**
 * 计算屏幕坐标对应的经纬度
 * @public
 * @author 朝阳
 * @version 1.0.0
 * 
 * @param {Viewer} viewer - Cesium 地图查看器实例
 * @param {Cartesian2} position - 屏幕坐标，原点在左上角
 * @returns {{Lon: number, Lat: number} | null} 返回经纬度对象，如果无法获取则返回 null
 * @memberof module:cesium/utils
 * 
 * @func 屏幕坐标转经纬度
 * @example
 * ```typescript
 * // 初始化查看器
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * 
 * // 监听鼠标点击事件
 * viewer.screenSpaceEventHandler.setInputAction((movement) => {
 *   const position = movement.position;
 *   const lonLat = getLonLat(viewer, position);
 *   
 *   if (lonLat) {
 *     console.log(`经度: ${lonLat.Lon}, 纬度: ${lonLat.Lat}`);
 *   } else {
 *     console.log('无法获取该位置的经纬度');
 *   }
 * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 * ```
 */
export function getLonLat(viewer: Viewer, position: Cartesian2): { Lon: number; Lat: number } | null {
    const ray = viewer.camera.getPickRay(position)!
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
    if (defined(cartesian)) {
        const cartographic = Cartographic.fromCartesian(cartesian)
        const Lon = Math.toDegrees(cartographic.longitude)
        const Lat = Math.toDegrees(cartographic.latitude)
        return { Lon, Lat }
    } else {
        return null
    }
}

/**
 * 将笛卡尔坐标转换为经纬度
 * @public
 * @version 1.0.0
 * 
 * @author 朝阳
 * @param {Cartesian3} cartesian - 笛卡尔坐标，表示地球表面或空间中的一个点
 * @returns {{Lon: number, Lat: number}} 返回包含经度和纬度的对象
 * @memberof module:cesium/utils
 * @func 笛卡尔坐标转经纬度
 * @example
 * ```typescript
 * // 创建一个笛卡尔坐标点（北京天安门上空1000米）
 * const cartesian = Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 1000);
 * 
 * // 转换为经纬度
 * const lonLat = getLonLatByCartesian(cartesian);
 * console.log(`经度: ${lonLat.Lon}, 纬度: ${lonLat.Lat}`);
 * 
 * // 输出: 经度: 116.3974, 纬度: 39.9093
 * ```
 */
export function getLonLatByCartesian(cartesian: Cartesian3): { Lon: number; Lat: number } {
    const cartographic = Cartographic.fromCartesian(cartesian)
    const Lon = Math.toDegrees(cartographic.longitude)
    const Lat = Math.toDegrees(cartographic.latitude)
    return { Lon, Lat }
}