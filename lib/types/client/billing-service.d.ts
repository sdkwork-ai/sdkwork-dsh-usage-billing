/**
 * 计费指标服务（ctx.billingMetrics）：把 UsageBilling 的实时费用摘要与
 * 弹窗打开能力开放给其他插件（如 acid-zine 主题的贴纸层）消费。
 *
 * 依赖方向为「billing 提供服务、主题适配消费」：billing 插件是唯一的
 * 写入方（组件通过 inject 的 publishCosts / registerOpen 写入），消费方
 * 只读费用快照并触发弹窗打开——billing 不反向依赖任何主题包。
 */
import type { CostCurrency } from './pricing.ts';
import type { BillingCardPrefs } from './usage-billing-settings.ts';
/** 计费摘要（精简版，仅供外部展示；金额为人民币元）。 */
export interface BillingCosts {
    todayCost: number;
    monthCost: number;
}
/** 触发卡迷你柱的一天：当日费用与当日消耗 token（口径与悬浮窗总 Token 一致）。 */
export interface BillingCardDay {
    date: string;
    cost: number;
    tokens: number;
}
/**
 * 侧栏触发卡的完整卡面快照：由 UsageBilling 实例在每次数据变化时发布，
 * 供**同一插件内的其他卡面**（原生设置页、设置菜单顶部账号卡）复用同一份
 * 数字与同一套口径——设置菜单卡不自己取数，避免两张卡显示不同金额。
 */
export interface BillingCardSnapshot {
    todayCost: number;
    weekCost: number;
    monthCost: number;
    todayTokens: number;
    weekTokens: number;
    monthTokens: number;
    /** 近 7 天迷你柱（最旧在前）。 */
    days: readonly BillingCardDay[];
    /** 今日 vs 昨日费用环比（百分比）；昨日无数据时为 0。 */
    deltaPct: number;
    /** 显示币种（卡面按它换算并格式化）。 */
    currency: CostCurrency;
    /** 卡面偏好（主指标 / 统计范围 / 是否显示环比徽章）。 */
    prefs: BillingCardPrefs;
    /** 取数失败原因（issue #119）：非空时卡面显示读取失败，而不是把 0 当真实用量。 */
    statsError?: string;
}
/** 消费方（如酸-zine 贴纸层）可用的只读接口。 */
export interface BillingMetricsService {
    /** 当前费用快照；从未发布过则 undefined。 */
    readCosts(): BillingCosts | undefined;
    /**
     * 订阅费用更新；立即收到当前值一次（若无值则为 undefined）。
     * @param listener - 费用回调。
     * @returns 退订函数。
     */
    subscribeCosts(listener: (costs: BillingCosts | undefined) => void): () => void;
    /** 当前触发卡卡面快照；从未发布过则 undefined。 */
    readCard(): BillingCardSnapshot | undefined;
    /**
     * 订阅卡面快照更新；立即收到当前值一次（若无值则为 undefined）。
     * @param listener - 卡面回调。
     * @returns 退订函数。
     */
    subscribeCard(listener: (card: BillingCardSnapshot | undefined) => void): () => void;
    /** 打开计费仪表盘（若 billing 弹窗已挂载）。 */
    openDashboard(): void;
}
/** 服务运行时：在只读接口之上追加写入入口，仅 apply 与组件使用。 */
export interface BillingMetricsRuntime extends BillingMetricsService {
    /** 发布最新费用摘要（UsageBilling 组件每次渲染数据变化时调用）。 */
    publishCosts(costs: BillingCosts): void;
    /** 发布最新卡面快照（同一次渲染算出的、侧栏卡正在显示的那份）。 */
    publishCard(card: BillingCardSnapshot): void;
    /**
     * 注册弹窗打开回调；组件卸载时应解除。
     * @param handler - 打开弹窗的处理函数。
     * @returns 解除注册的函数。
     */
    registerOpen(handler: () => void): () => void;
}
/** 创建计费指标运行时（apply 内调用，随插件纤维存活）。 */
export declare function createBillingMetrics(): BillingMetricsRuntime;
//# sourceMappingURL=billing-service.d.ts.map