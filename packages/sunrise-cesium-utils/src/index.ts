import { Cartesian3, Cartographic, HeadingPitchRoll, Matrix4, sampleTerrain, Transforms } from "cesium"
import { ICalculateLocationType } from "./types"
/**
 * @Date: 2024-02-27 11:30:59
 * @Author: 朝阳
 * @function: 计算位置矩阵，根据传入的数据去获取新的位置数据
 * @return {Matrix4} 返回结果
 * @param {number} longitude
 * @param {number} latitude
 * @param {number} heading
 * @param {CesiumTerrainProvider} terrainProvider
 */
export const calculateLocationMatrix = async ({
    longitude,
    latitude,
    heading = 0,
    terrainProvider
}: ICalculateLocationType): Promise<Matrix4> => {
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