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
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { BillingCardSnapshot } from './billing-service.ts';
import { NS, type UsageBillingKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /**
         * 设置菜单账号身份行下方的卡面座位（宿主 ui-sdkwork-settings-menu 声明并
         * 渲染）。owner 只给一个关闭菜单的回调：卡面打开仪表盘后菜单不该继续挡着。
         */
        'settings.menu.account': {
            kind: 'single';
            scope: 'root';
            owner: SettingsMenuAccountOwnerProps;
        };
    }
}
/** 宿主菜单交给卡面的 owner 份额。 */
export interface SettingsMenuAccountOwnerProps {
    /** 关闭设置菜单（卡面打开仪表盘时调用）。 */
    close: () => void;
}
/** 卡面的注入面：读同一份卡面快照 + 打开仪表盘。 */
export interface SettingsUsageCardInjected {
    /** 当前卡面快照（侧栏实例发布）；从未发布过则 undefined。 */
    readCard: () => BillingCardSnapshot | undefined;
    /** 订阅卡面快照；立即收到当前值一次。 */
    subscribeCard: (listener: (card: BillingCardSnapshot | undefined) => void) => () => void;
    /** 打开完整计费仪表盘（未挂载时为空操作）。 */
    openDashboard: () => void;
}
/** 卡面完整 props：座位 owner 份额 + 注入面 + 本包词典。 */
export type SettingsUsageCardProps = PropsRuntime<'settings.menu.account'> & InjectFace<SettingsUsageCardInjected> & PropsLocale<typeof NS>;
/** 卡面投影出的展示串（纯函数，便于单测）。 */
export interface SettingsUsageCardView {
    /** 维度标签（今日消耗金额 / 今日消耗 Token …）。 */
    label: string;
    /** 主指标是否 Token 视角（Token 不带币符）。 */
    tokenView: boolean;
    /** 币种符号（Token 视角为空串）。 */
    symbol: string;
    /** 主数字文本（不含币符）。 */
    valueText: string;
    /** 环比徽章文本（金钱视角 + 今日口径 + 开关打开 + 非零时才有）。 */
    deltaText: string | undefined;
    /** 近 7 天迷你柱高度（4~16px）。 */
    sparkHeights: readonly number[];
    /** 悬停标题：维度 + 金额 + 取数失败原因。 */
    title: string;
    /** 取数失败：图标转红（数字此时不可信）。 */
    error: boolean;
}
/**
 * 把卡面快照投影成展示串：与侧栏触发卡同一套口径（显示币种、统计范围、
 * 环比、取数失败）。
 * @param card - 侧栏实例发布的卡面快照。
 * @param t - 本包词典（界面语言与本插件偏好一致）。
 * @returns 卡面展示串。
 */
export declare function settingsCardViewOf(card: BillingCardSnapshot, t: (key: UsageBillingKey) => string): SettingsUsageCardView;
/**
 * Render the settings-menu account card.
 * @param props - framework props (seat owner share + inject face + locale).
 * @returns the card, or null before the sidebar instance has published a snapshot.
 */
export declare function SettingsUsageCard(props: SettingsUsageCardProps): React.ReactNode;
//# sourceMappingURL=SettingsUsageCard.d.ts.map