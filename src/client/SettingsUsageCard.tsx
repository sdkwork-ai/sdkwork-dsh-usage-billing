/**
 * 设置菜单顶部账号卡：侧栏触发卡默认隐藏后，用户最顺手的常驻入口。
 *
 * 座位 `settings.menu.account` 由宿主（ui-sdkwork-settings-menu）在账号身份行
 * 下方渲染 —— 打开齿轮菜单，用户名下面就是今日花费。卡面不自己取数：它读
 * `ctx.billingMetrics` 里侧栏实例发布的**同一份** BillingCardSnapshot，因此
 * 金额、币种、统计范围、环比与取数失败态和侧栏卡永远一致（两处各算一遍就会
 * 出现「同一笔钱两个数」）。
 *
 * 点击卡面 = 打开完整仪表盘（宿主菜单随后关闭）。老宿主没有声明该座位时，
 * `ctx.slots.inject` 的回调不执行，插件其余表面照旧。
 */

import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { BillingCardSnapshot } from './billing-service.ts'
import { BillingGaugeIcon } from './gauge.tsx'
import { convertFromCny, formatMoney, formatTokens } from './pricing.ts'
import { en, NS, zh, type UsageBillingKey } from './locales.ts'
import { LANGUAGE_PREF_EVENT, loadLanguage, type BillingLanguage } from './usage-billing-settings.ts'
import css from './SettingsUsageCard.module.css'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * 设置菜单账号身份行下方的卡面座位（宿主 ui-sdkwork-settings-menu 声明并
     * 渲染）。owner 只给一个关闭菜单的回调：卡面打开仪表盘后菜单不该继续挡着。
     */
    'settings.menu.account': { kind: 'single'; scope: 'root'; owner: SettingsMenuAccountOwnerProps }
  }
}

/** 宿主菜单交给卡面的 owner 份额。 */
export interface SettingsMenuAccountOwnerProps {
  /** 关闭设置菜单（卡面打开仪表盘时调用）。 */
  close: () => void
}

/** 卡面的注入面：读同一份卡面快照 + 打开仪表盘。 */
export interface SettingsUsageCardInjected {
  /** 当前卡面快照（侧栏实例发布）；从未发布过则 undefined。 */
  readCard: () => BillingCardSnapshot | undefined
  /** 订阅卡面快照；立即收到当前值一次。 */
  subscribeCard: (listener: (card: BillingCardSnapshot | undefined) => void) => () => void
  /** 打开完整计费仪表盘（未挂载时为空操作）。 */
  openDashboard: () => void
}

/** 卡面完整 props：座位 owner 份额 + 注入面 + 本包词典。 */
export type SettingsUsageCardProps =
  PropsRuntime<'settings.menu.account'>
  & InjectFace<SettingsUsageCardInjected>
  & PropsLocale<typeof NS>

/** 卡面投影出的展示串（纯函数，便于单测）。 */
export interface SettingsUsageCardView {
  /** 维度标签（今日消耗金额 / 今日消耗 Token …）。 */
  label: string
  /** 主指标是否 Token 视角（Token 不带币符）。 */
  tokenView: boolean
  /** 币种符号（Token 视角为空串）。 */
  symbol: string
  /** 主数字文本（不含币符）。 */
  valueText: string
  /** 环比徽章文本（金钱视角 + 今日口径 + 开关打开 + 非零时才有）。 */
  deltaText: string | undefined
  /** 近 7 天迷你柱高度（4~16px）。 */
  sparkHeights: readonly number[]
  /** 悬停标题：维度 + 金额 + 取数失败原因。 */
  title: string
  /** 取数失败：图标转红（数字此时不可信）。 */
  error: boolean
}

/**
 * 把卡面快照投影成展示串：与侧栏触发卡同一套口径（显示币种、统计范围、
 * 环比、取数失败）。
 * @param card - 侧栏实例发布的卡面快照。
 * @param t - 本包词典（界面语言与本插件偏好一致）。
 * @returns 卡面展示串。
 */
export function settingsCardViewOf(
  card: BillingCardSnapshot,
  t: (key: UsageBillingKey) => string,
): SettingsUsageCardView {
  const tokenView = card.prefs.metric === 'tokens'
  const span = card.prefs.span
  const label = tokenView
    ? (span === 'day' ? t('triggerTodayTokens') : span === 'week' ? t('triggerWeekTokens') : t('triggerMonthTokens'))
    : (span === 'day' ? t('triggerToday') : span === 'week' ? t('weekCost') : t('triggerMonth'))
  const value = span === 'day'
    ? (tokenView ? card.todayTokens : card.todayCost)
    : span === 'week'
      ? (tokenView ? card.weekTokens : card.weekCost)
      : (tokenView ? card.monthTokens : card.monthCost)
  const money = formatMoney(convertFromCny(value, card.currency), card.currency)
  const values = card.days.map(day => (tokenView ? day.tokens : day.cost))
  const max = Math.max(...values, 0)
  return {
    label,
    tokenView,
    symbol: tokenView ? '' : money.charAt(0),
    valueText: tokenView ? formatTokens(value) : money.slice(1),
    deltaText: !tokenView && span === 'day' && card.prefs.showDelta && card.deltaPct !== 0
      ? `${card.deltaPct > 0 ? '▲' : '▼'} ${Math.abs(card.deltaPct).toFixed(1)}%`
      : undefined,
    sparkHeights: values.map(entry => (max > 0 ? 4 + (entry / max) * 12 : 4)),
    title: `${t('title')} · ${tokenView ? formatTokens(value) : money}${card.statsError === undefined ? '' : ` · ${t('statsLoadFailed')}`}`,
    error: card.statsError !== undefined,
  }
}

/**
 * Render the settings-menu account card.
 * @param props - framework props (seat owner share + inject face + locale).
 * @returns the card, or null before the sidebar instance has published a snapshot.
 */
export function SettingsUsageCard(props: SettingsUsageCardProps): React.ReactNode {
  const { readCard, subscribeCard, openDashboard, close, t: hostT } = props
  const [card, setCard] = useState<BillingCardSnapshot | undefined>(() => readCard())
  useEffect(() => subscribeCard(setCard), [subscribeCard])
  // 界面语言走本插件自己的偏好（与面板一致，不跟随宿主全局语言）。
  const [language, setLanguage] = useState<BillingLanguage>(() => loadLanguage())
  useEffect(() => {
    const reread = (): void => { setLanguage(loadLanguage()) }
    window.addEventListener(LANGUAGE_PREF_EVENT, reread)
    return () => { window.removeEventListener(LANGUAGE_PREF_EVENT, reread) }
  }, [])
  const t = useCallback((key: UsageBillingKey): string => {
    const dictionary = language === 'en' ? en : zh
    return dictionary[key] ?? hostT(key)
  }, [language, hostT])

  if (card === undefined) return null
  const view = settingsCardViewOf(card, t)

  return (
    <button
      type="button"
      className={css.card}
      title={view.title}
      data-testid="billing-settings-menu-card"
      onClick={() => {
        openDashboard()
        close()
      }}
    >
      <span className={clsx(css.gauge, view.error && css.gaugeError)} aria-hidden="true">
        <BillingGaugeIcon todayCost={card.todayCost} days={card.days} />
      </span>
      <span className={css.main}>
        <span className={css.label}>{view.label}</span>
        <span className={css.valueRow}>
          {view.tokenView
            ? <span className={css.value} data-testid="billing-settings-menu-value">{view.valueText}</span>
            : (
              <>
                <span className={css.currency} aria-hidden="true">{view.symbol}</span>
                <span className={css.value} data-testid="billing-settings-menu-value">{view.valueText}</span>
              </>
            )}
          {view.deltaText !== undefined && (
            <span
              className={clsx(css.delta, card.deltaPct > 0 ? css.deltaUp : css.deltaDown)}
              data-testid="billing-settings-menu-delta"
            >
              {view.deltaText}
            </span>
          )}
        </span>
      </span>
      <span className={css.spark} data-testid="billing-settings-menu-spark" aria-hidden="true">
        {view.sparkHeights.map((height, index) => (
          <span
            key={card.days[index]?.date ?? String(index)}
            className={clsx(css.sparkBar, index === view.sparkHeights.length - 1 && css.sparkHot)}
            style={{ height: `${height}px` }}
          />
        ))}
      </span>
    </button>
  )
}
