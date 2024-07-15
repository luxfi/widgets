import Widget from "../Widget";
declare global {
    interface Window {
        web3: any;
    }
}
interface SiteRuleItem {
    collector(): void;
    onHashChange?(): void;
}
interface UniSwapParams {
    amount: string;
    protocols: string;
    tokenInAddress: string;
    tokenInChainId: string;
    tokenOutAddress: string;
    tokenOutChainId: string;
    type: 'exactIn' | 'exactOut';
}
export default class DEXPriceComparison extends Widget {
    private currentRule;
    private enable;
    private el;
    static widgetName: string;
    static image: string;
    static description: string;
    static version: string;
    constructor(rule: string);
    static include: string[];
    siteRule: Record<string, SiteRuleItem>;
    handleResize: (...args: any[]) => void;
    render: (values?: {
        quotes: any;
        fromDecimals: number;
        toDecimals: number;
        amount: string;
    }) => void;
    handler: (values: {
        from: string;
        to: string;
        amount: string;
        fromDecimals: number;
        toDecimals: number;
        dexToAmount: string;
        type: UniSwapParams['type'];
    }) => void;
    destory: () => void;
}
export {};
