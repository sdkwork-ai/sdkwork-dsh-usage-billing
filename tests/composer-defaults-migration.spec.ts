// @vitest-environment jsdom
/**
 * fork 一次性迁移：输入框底栏两枚胶囊默认不显示。
 *
 * 光改默认值不够——旧版本的默认值是「显示」，任何一次写偏好都会把 `show: true` /
 * `showEntry: true` 固化进 localStorage。迁移在没跑过的浏览器上把两个显示字段关
 * 一次并写标记；之后用户在设置中心手动打开就按存储值生效。
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  COMPOSER_FOOTER_MIGRATION_KEY,
  loadLiveCostBarPrefs,
  loadQuickQueuePrefs,
  migrateComposerFooterDefaults,
  saveLiveCostBarPrefs,
  saveQuickQueuePrefs,
} from '../src/client/usage-billing-settings.ts'

beforeEach(() => { localStorage.clear() })

describe('输入框底栏默认隐藏迁移', () => {
  it('旧版本固化的 show/showEntry true 会被关一次并写标记（其它字段保留）', () => {
    saveLiveCostBarPrefs({ show: true, position: 'below' })
    saveQuickQueuePrefs({ enabled: true, clearAfterEnqueue: true, showEntry: true })

    migrateComposerFooterDefaults()

    expect(loadLiveCostBarPrefs()).toEqual({ show: false, position: 'below' })
    expect(loadQuickQueuePrefs()).toEqual({
      enabled: true, clearAfterEnqueue: true, showEntry: false, reuseSourceSession: false,
    })
    expect(localStorage.getItem(COMPOSER_FOOTER_MIGRATION_KEY)).toBe('1')
  })

  it('迁移之后用户手动打开不会被再次覆盖', () => {
    migrateComposerFooterDefaults()
    saveLiveCostBarPrefs({ show: true, position: 'toolbar' })
    saveQuickQueuePrefs({ showEntry: true })

    migrateComposerFooterDefaults()

    expect(loadLiveCostBarPrefs().show).toBe(true)
    expect(loadQuickQueuePrefs().showEntry).toBe(true)
  })

  it('全新安装迁移后保持默认隐藏，队列的其它开关不受影响', () => {
    saveQuickQueuePrefs({ enabled: true, reuseSourceSession: true })

    migrateComposerFooterDefaults()

    expect(loadQuickQueuePrefs()).toEqual({
      enabled: true, clearAfterEnqueue: false, showEntry: false, reuseSourceSession: true,
    })
    expect(loadLiveCostBarPrefs()).toEqual({ show: false, position: 'toolbar' })
  })
})
