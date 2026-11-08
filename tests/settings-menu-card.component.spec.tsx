// @vitest-environment jsdom
/**
 * 设置菜单账号卡：侧栏卡默认隐藏后，卡面在设置菜单用户名下方承载同一份数字。
 *
 * 两条契约在这里钉住：投影口径（币种/统计范围/环比/取数失败态与侧栏卡一致），
 * 以及点击行为（打开完整仪表盘并关闭菜单）。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SettingsUsageCard, settingsCardViewOf } from '../src/client/SettingsUsageCard.tsx'
import type { BillingCardSnapshot } from '../src/client/billing-service.ts'
import { createBillingMetrics } from '../src/client/billing-service.ts'
import { zh } from '../src/client/locales.ts'

const t = (key: string): string => (zh as Record<string, string>)[key] ?? key

beforeEach(() => { localStorage.clear() })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** 一张卡面快照：默认今日 47.6 元、昨日环比 +105.4%、近 7 天有柱。 */
function snapshot(patch: Partial<BillingCardSnapshot> = {}): BillingCardSnapshot {
  return {
    todayCost: 47.6,
    weekCost: 120,
    monthCost: 380,
    todayTokens: 12_345,
    weekTokens: 90_000,
    monthTokens: 400_000,
    days: [
      { date: '2026-11-02', cost: 2, tokens: 1_000 },
      { date: '2026-11-03', cost: 4, tokens: 2_000 },
      { date: '2026-11-04', cost: 3, tokens: 3_000 },
      { date: '2026-11-05', cost: 6, tokens: 4_000 },
      { date: '2026-11-06', cost: 5, tokens: 5_000 },
      { date: '2026-11-07', cost: 8, tokens: 6_000 },
      { date: '2026-11-08', cost: 9, tokens: 7_000 },
    ],
    deltaPct: 105.4,
    currency: 'cny',
    prefs: { mode: 'hidden', metric: 'money', span: 'day', showDelta: true },
    ...patch,
  }
}

/** 组件 props：座位 owner（close）+ 注入面 + 词典。 */
function makeProps(card: BillingCardSnapshot | undefined): {
  props: Parameters<typeof SettingsUsageCard>[0]
  openDashboard: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
} {
  const metrics = createBillingMetrics()
  if (card !== undefined) metrics.publishCard(card)
  const openDashboard = vi.fn()
  const close = vi.fn()
  const props = {
    t,
    close,
    readCard: () => metrics.readCard(),
    subscribeCard: (listener: (next: BillingCardSnapshot | undefined) => void) => metrics.subscribeCard(listener),
    openDashboard,
  } as unknown as Parameters<typeof SettingsUsageCard>[0]
  return { props, openDashboard, close }
}

describe('settingsCardViewOf（卡面投影）', () => {
  it('今日口径：维度标签 + 金额 + 环比徽章与侧栏卡一致', () => {
    const view = settingsCardViewOf(snapshot(), t)
    expect(view.label).toBe('今日消耗金额')
    expect(view.tokenView).toBe(false)
    expect(view.symbol).toBe('¥')
    expect(view.valueText).toBe('47.6')
    expect(view.deltaText).toBe('▲ 105.4%')
    expect(view.sparkHeights).toHaveLength(7)
    expect(view.error).toBe(false)
  })

  it('Token 视角不带币符；环比徽章只在金钱视角出现', () => {
    const view = settingsCardViewOf(snapshot({
      prefs: { mode: 'hidden', metric: 'tokens', span: 'week', showDelta: true },
    }), t)
    expect(view.label).toBe('本周消耗 Token')
    expect(view.symbol).toBe('')
    expect(view.valueText).toBe('90K')
    expect(view.deltaText).toBeUndefined()
  })

  it('取数失败：标题带上失败原因，图标进入错误态', () => {
    const view = settingsCardViewOf(snapshot({ statsError: '会话列表读取失败' }), t)
    expect(view.error).toBe(true)
    expect(view.title).toContain('统计数据读取失败')
  })
})

describe('SettingsUsageCard', () => {
  it('渲染用户名下方的卡面；点击打开仪表盘并关闭菜单', () => {
    const { props, openDashboard, close } = makeProps(snapshot())
    render(<SettingsUsageCard {...props} />)

    expect(screen.getByTestId('billing-settings-menu-value').textContent).toBe('47.6')
    expect(screen.getByTestId('billing-settings-menu-delta').textContent).toBe('▲ 105.4%')
    fireEvent.click(screen.getByTestId('billing-settings-menu-card'))
    expect(openDashboard).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('侧栏实例还没发布快照时不画空壳', () => {
    const { props } = makeProps(undefined)
    const { container } = render(<SettingsUsageCard {...props} />)
    expect(container.querySelector('[data-testid="billing-settings-menu-card"]')).toBeNull()
  })
})
