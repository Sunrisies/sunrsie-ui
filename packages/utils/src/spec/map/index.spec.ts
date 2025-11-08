import { getCenterLonLat, calculateNewPoints, distanceLngLat } from '../../index'; // 根据实际文件路径修改
import { vi, describe, it, expect } from 'vitest';


describe('distanceLngLat', () => {
    it('应正确计算距离和中心点', () => {
        const result = distanceLngLat(39.9042, 116.4074, 31.2304, 121.4737);
        expect(result.lon).toBeCloseTo(118.94055, 4); // 中心点经度
        expect(result.lat).toBeCloseTo(35.5673, 4); // 中心点纬度
        expect(result.distance).toBeCloseTo(5003196.1329, 0); // 距离
    });

    it('应抛出无效纬度错误', () => {
        expect(() => distanceLngLat(100, 116.4074, 31.2304, 121.4737)).toThrow('纬度必须在 -90 到 90 之间');
    });

    it('应抛出经度无效的错误', () => {
        expect(() => distanceLngLat(39.9042, 200, 31.2304, 121.4737)).toThrow('经度必须在 -180 到 180 之间');
    });
});



describe('getCenterLonLat', () => {
    it('应正确计算中心经纬度', () => {
        const center = getCenterLonLat(116.4074, 39.9042, 121.4737, 31.2304);
        expect(center[0]).toBeCloseTo(118.94055, 4); // 经度
        expect(center[1]).toBeCloseTo(35.5673, 4); // 纬度
    });

    it('应抛出经度无效的错误', () => {
        expect(() => getCenterLonLat(190, 39.9042, 121.4737, 31.2304)).toThrow('经度必须在 -180 到 180 之间');
    });

    it('应抛出无效纬度错误', () => {
        expect(() => getCenterLonLat(116.4074, 100, 121.4737, 31.2304)).toThrow('纬度必须在 -90 到 90 之间');
    });
});

describe('calculateNewPoints', () => {
    it('应该正确计算新点数', () => {
        const centerLat = 33.4148429; // 中心点纬度
        const centerLon = 113.5930592; // 中心点经度
        const distance = 1; // 距离（米）

        const newPoints = calculateNewPoints({ lat: centerLat, lon: centerLon, distance });

        // 预期结果
        const expectedPoints = [
            [113.5930699741221, 33.414842899999535], // 第一个点
            [113.5930592, 33.41483390678393],        // 第二个点
            [113.5930484258779, 33.414842899999535], // 第三个点
            [113.5930592, 33.41485189321607]         // 第四个点
        ];

        // 检查每个点是否接近预期结果
        newPoints.forEach((point, index) => {
            expect(point[0]).toBeCloseTo(expectedPoints[index][0], 4); // 经度
            expect(point[1]).toBeCloseTo(expectedPoints[index][1], 4); // 纬度
        });
    });

    it('应正确处理远距离', () => {
        const centerLat = 33.4148429; // 中心点纬度
        const centerLon = 113.5930592; // 中心点经度
        const distance = 100000; // 较大的距离（米）

        const newPoints = calculateNewPoints({ lat: centerLat, lon: centerLon, distance });

        // 检查新点是否在合理范围内
        newPoints.forEach(point => {
            expect(point[0]).toBeGreaterThanOrEqual(-180);
            expect(point[0]).toBeLessThanOrEqual(180);
            expect(point[1]).toBeGreaterThanOrEqual(-90);
            expect(point[1]).toBeLessThanOrEqual(90);
        });
    });

    it('应抛出无效纬度错误', () => {
        const centerLat = 100; // 无效的纬度
        const centerLon = 113.5930592; // 中心点经度
        const distance = 1; // 距离（米）

        expect(() => calculateNewPoints({ lat: centerLat, lon: centerLon, distance })).toThrow('纬度必须在 -90 到 90 之间');
    });

    it('应抛出经度无效的错误', () => {
        const centerLat = 33.4148429; // 中心点纬度
        const centerLon = 200; // 无效的经度
        const distance = 1; // 距离（米）

        expect(() => calculateNewPoints({ lat: centerLat, lon: centerLon, distance })).toThrow('经度必须在 -180 到 180 之间');
    });
});

