/**
 * 计费仪表 Icon（侧栏触发卡与设置菜单账号卡共用同一枚指针表）：40 viewBox
 * 半圆仪表——低透明度全程轨道弧 + 水位进度弧（弧长随水位伸缩）+ 五档主刻度
 * 与细分刻度 + 数据驱动指针。
 *
 * 水位 = 当日费用 / 近 7 日均值（1.0 = 与日均持平，指针垂直；越高越向右满摆）。
 * 无数据归零位。抽成独立组件的原因只有一个：两个卡面必须画同一枚表、用同一
 * 口径，任何视觉漂移都该是「改这里」，而不是各画一份。
 */

import css from './UsageBilling.module.css'

/** 仪表量程半径 15、扫角 ±80°：弧长 = 15 × 160° ≈ 41.9。 */
const ARC_LENGTH = 41.9

/**
 * 当日费用相对近 7 日均值的水位（0~1）。
 * @param todayCost - 当日费用（人民币元）。
 * @param days - 近 7 天费用序列（最旧在前）。
 * @returns 0（无数据 / 低于零）到 1（满摆）。
 */
export function gaugeWaterOf(todayCost: number, days: readonly { cost: number }[]): number {
  const average = days.length > 0 ? days.reduce((sum, day) => sum + day.cost, 0) / days.length : 0
  return average > 0 ? Math.max(0, Math.min(1, todayCost / average)) : 0
}

/**
 * Render the billing gauge glyph.
 * @param props.todayCost - 当日费用（人民币元）。
 * @param props.days - 近 7 天费用序列（最旧在前）。
 * @returns the gauge SVG (currentColor driven).
 */
export function BillingGaugeIcon({ todayCost, days }: {
  /** 当日费用（人民币元）。 */
  todayCost: number
  /** 近 7 天费用序列（最旧在前）。 */
  days: readonly { cost: number }[]
}): React.ReactNode {
  const water = gaugeWaterOf(todayCost, days)
  const angle = -80 + water * 160
  return (
    <svg viewBox="3.5 10 34 22" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      {/* 全程轨道弧（量程 -80° → +80°） */}
      <path d="M5.23 26.4A15 15 0 0 1 34.77 26.4" strokeWidth={3} opacity={0.16} />
      {/* 进度弧：当日水位占量程比例，弧长随 30s 轮询平滑伸缩 */}
      <path
        d="M5.23 26.4A15 15 0 0 1 34.77 26.4"
        strokeWidth={3}
        strokeDasharray={`${(ARC_LENGTH * water).toFixed(2)} ${ARC_LENGTH}`}
        className={css.triggerGaugeArc}
      />
      {/* 主刻度（五档） */}
      <path d="M5.23 26.4 8.18 26.92M10.36 17.51 12.29 19.81M20 14v3M27.71 19.81 29.64 17.51M31.82 26.92 34.77 26.4" strokeWidth={1.6} opacity={0.7} />
      {/* 细分刻度 */}
      <path d="M7.01 21.5 8.31 22.25M14.87 14.91 15.38 16.31M24.62 16.31 25.13 14.91M31.69 22.25 32.99 21.5" strokeWidth={1.2} opacity={0.38} />
      {/* 指针：角度随当日水位旋转；CSS transform + transition 让轮询更新时平滑摆动 */}
      <line
        x1="20"
        y1="29"
        x2="20"
        y2="19.5"
        strokeWidth={2}
        className={css.triggerGaugeNeedle}
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: '20px 29px' }}
      />
      {/* 中心轴点 */}
      <circle cx="20" cy="29" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
