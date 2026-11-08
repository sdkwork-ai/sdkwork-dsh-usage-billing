/**
 * 计费仪表 Icon（侧栏触发卡与设置菜单账号卡共用同一枚指针表）：40 viewBox
 * 半圆仪表——低透明度全程轨道弧 + 水位进度弧（弧长随水位伸缩）+ 五档主刻度
 * 与细分刻度 + 数据驱动指针。
 *
 * 水位 = 当日费用 / 近 7 日均值（1.0 = 与日均持平，指针垂直；越高越向右满摆）。
 * 无数据归零位。抽成独立组件的原因只有一个：两个卡面必须画同一枚表、用同一
 * 口径，任何视觉漂移都该是「改这里」，而不是各画一份。
 */
/**
 * 当日费用相对近 7 日均值的水位（0~1）。
 * @param todayCost - 当日费用（人民币元）。
 * @param days - 近 7 天费用序列（最旧在前）。
 * @returns 0（无数据 / 低于零）到 1（满摆）。
 */
export declare function gaugeWaterOf(todayCost: number, days: readonly {
    cost: number;
}[]): number;
/**
 * Render the billing gauge glyph.
 * @param props.todayCost - 当日费用（人民币元）。
 * @param props.days - 近 7 天费用序列（最旧在前）。
 * @returns the gauge SVG (currentColor driven).
 */
export declare function BillingGaugeIcon({ todayCost, days }: {
    /** 当日费用（人民币元）。 */
    todayCost: number;
    /** 近 7 天费用序列（最旧在前）。 */
    days: readonly {
        cost: number;
    }[];
}): React.ReactNode;
//# sourceMappingURL=gauge.d.ts.map