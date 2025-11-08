import { describe, expect, it } from 'vitest';
import { wgs84ToGcj02, gcj02ToWgs84, out_of_china } from '../../index';

describe('坐标转换工具', () => {
    describe('wgs84ToGcj02 火星坐标转换', () => {
        it('正确转换已知坐标点', () => {
            const [lng, lat] = wgs84ToGcj02(114.1808934593, 22.322230460245);
            expect(lng).toBeCloseTo(114.18582963264353);  // 允许0.0001精度误差
            expect(lat).toBeCloseTo(22.319458929409972);
        });


        it('无效参数抛出错误', () => {
            // @ts-ignore 测试错误类型
            expect(() => wgs84ToGcj02('116', 39)).toThrow('坐标必须为数字类型');
            expect(() => wgs84ToGcj02(190, 39)).toThrow('坐标值应在-180到180之间');
        });
    });

    describe('gcj02ToWgs84 逆向转换', () => {
        it('正确逆向转换已知点', () => {
            const [lng, lat] = gcj02ToWgs84(114.1808934593, 22.322230460245);
            expect(lng).toBeCloseTo(114.17595728595646);
            expect(lat).toBeCloseTo(22.325001991080025);
        });

        it('多次转换应趋近原始值', () => {
            const original = [121.473701, 31.230416]; // 上海坐标
            const converted = wgs84ToGcj02(original[0], original[1]);
            const reverted = gcj02ToWgs84(...converted);
            expect(reverted[0]).toBeCloseTo(original[0], 1); // 精度1位小数
            expect(reverted[1]).toBeCloseTo(original[1], 1);
        });
    });

    describe('中国境外判断', () => {
        it('识别境外东部坐标', () => {
            expect(out_of_china(137.835, 35)).toBe(true);  // 东经137.835+
        });

        it('识别境外西部坐标', () => {
            expect(out_of_china(71.0, 35)).toBe(true);  // 东经71-
        });

        it('识别国内坐标', () => {
            expect(out_of_china(116.4074, 39.9042)).toBe(false); // 北京
        });
    });
});