import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatChineseDateTime, TimeUpdater, TimeFormatter, Timer, convertTime } from '../common/index';




describe('时间更新工具', () => {
    // 原代码报错找不到命名空间“vi”，可将类型声明改为 any 临时解决类型问题
    let mockCallback: any;

    beforeEach(() => {
        vi.useFakeTimers();
        mockCallback = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('TimeFormatter 格式化', () => {
        test('日期格式化 YYYY-MM-DD', () => {
            const formatter = new TimeFormatter();
            const date = new Date(2024, 5, 15); // 2024-06-15
            expect(formatter.formatDate(date)).toBe('2024-06-15');
        });

        test('星期格式化', () => {
            const formatter = new TimeFormatter();
            const date = new Date(2024, 5, 15); // 星期六
            expect(formatter.getWeekday(date)).toBe('星期六');
        });

        test('时间格式化 HH:mm:ss', () => {
            const formatter = new TimeFormatter();
            const date = new Date(2024, 5, 15, 9, 5, 30);
            expect(formatter.formatTime(date)).toBe('09:05:30');
        });
    });

    describe('Timer 定时器', () => {
        test('定时启动和停止', () => {
            const timer = new Timer();
            const callback = vi.fn();

            timer.start(callback, 1000);
            vi.advanceTimersByTime(3000);
            timer.stop();

            expect(callback).toHaveBeenCalledTimes(3);
            vi.advanceTimersByTime(3000);
            expect(callback).toHaveBeenCalledTimes(3); // 停止后不再触发
        });
    });

    describe('TimeUpdater 集成测试', () => {
        test('定期更新时间回调', () => {
            const updater = new TimeUpdater();
            updater.startUpdate(mockCallback);

            vi.advanceTimersByTime(2500);
            updater.stopUpdate();

            expect(mockCallback).toHaveBeenCalledTimes(3); // 立即调用 + 2次间隔
            const lastCall = mockCallback.mock.calls[0][0];
            expect(lastCall).toEqual({
                formattedDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                today: expect.stringMatching(/^星期/),
                nowTime: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/)
            });
        });

        test('停止更新后不再触发回调', () => {
            const updater = new TimeUpdater();
            updater.startUpdate(mockCallback);

            vi.advanceTimersByTime(1000);
            updater.stopUpdate();
            vi.advanceTimersByTime(3000);

            expect(mockCallback).toHaveBeenCalledTimes(2); // 立即调用 + 1次间隔
        });
    });
});


describe('日期时间格式化工具', () => {
    test('正确解析ISO格式字符串', () => {
        const isoDate = '2025-03-25T08:32:11.469Z';
        // 预期结果根据北京时间（UTC+8）计算
        expect(formatChineseDateTime(isoDate)).toBe('2025年03月25日 16:32:11');
    });

    test('正确格式化常规日期时间', () => {
        const date = new Date(2024, 2, 15, 10, 5, 30); // 注意：月份从0开始，2表示3月
        expect(formatChineseDateTime(date)).toBe('2024年03月15日 10:05:30');
    });

    test('处理个位数月份和日期', () => {
        const date = new Date(2023, 0, 5, 9, 3, 2); // 2023-01-05 09:03:02
        expect(formatChineseDateTime(date)).toBe('2023年01月05日 09:03:02');
    });

    test('处理午夜时间', () => {
        const date = new Date(2024, 11, 31, 0, 0, 0); // 2024-12-31 00:00:00
        expect(formatChineseDateTime(date)).toBe('2024年12月31日 00:00:00');
    });

    test('处理闰年日期', () => {
        const date = new Date(2024, 1, 29, 15, 30, 0); // 2024-02-29 15:30:00
        expect(formatChineseDateTime(date)).toBe('2024年02月29日 15:30:00');
    });
});


describe('convertTime 时间转换函数', () => {
    test('正确处理边界值', () => {
        expect(convertTime(60)).toBe('1 分')       // 整分钟
        expect(convertTime(3600)).toBe('1 时')      // 整小时
        expect(convertTime(86400)).toBe('1 天')     // 整天
    })

    test('正确处理整数秒数', () => {
        expect(convertTime(139.903289794922)).toBe('2 分 20 秒')    // 1分1秒
        // expect(convertTime(3661)).toBe('1时1分1秒')  // 1时1分1秒
    })

    test('组合时间单位', () => {
        expect(convertTime(90061)).toBe('1 天 1 时 1 分 1 秒')
        expect(convertTime(3723)).toBe('1 时 2 分 3 秒')
    })

    test('小数处理', () => {
        expect(convertTime(45.5)).toBe('46 秒')
        expect(convertTime(0.005)).toBe('0 秒')      // 四舍五入
    })

    test('错误输入处理', () => {
        // @ts-ignore 测试类型错误
        expect(() => convertTime('60')).toThrowError('参数必须为有效数字')
        // @ts-ignore 测试非法值
        expect(() => convertTime(NaN)).toThrowError()
    })

    test('短时间格式', () => {
        expect(convertTime(59.999)).toBe('1 分')    // 接近1分钟
        expect(convertTime(119)).toBe('1 分 59 秒')    // 接近2分钟
    })
    test('英文格式', () => {
        expect(convertTime(60, 'en')).toBe('1 m')       // 整分钟
        expect(convertTime(3600, 'en')).toBe('1 h')      // 整小时
        expect(convertTime(86400, 'en')).toBe('1 d')     // 整天
    })
    test("英文格式小数处理", () => {
        expect(convertTime(45.5, 'en')).toBe('46 s')    // 1分1秒
        expect(convertTime(0.005, 'en')).toBe('0 s')      // 四舍五入
    })
    test("英文格式短时间格式", () => {
        expect(convertTime(59.999, 'en')).toBe('1 m')    // 接近1分钟
        expect(convertTime(119, 'en')).toBe('1 m 59 s')    // 接近2分钟
    })
    test('英文组合时间单位', () => {
        expect(convertTime(90061, 'en')).toBe('1 d 1 h 1 m 1 s')
        expect(convertTime(3723, 'en')).toBe('1 h 2 m 3 s')
    })
})