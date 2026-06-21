import { AccountType, AccountSubType, NormalBalance } from './enums';
export interface DefaultAccount {
    code: string;
    name: string;
    type: AccountType;
    subType: AccountSubType;
    normalBalance: NormalBalance;
    isSystem: boolean;
    isContra: boolean;
    description?: string;
    systemTag?: string;
}
export declare const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[];
export declare const SYSTEM_ACCOUNT_TAGS: {
    readonly AR: "AR";
    readonly AP: "AP";
    readonly TAX_PAYABLE: "TAX_PAYABLE";
    readonly TAX_RECEIVABLE: "TAX_RECEIVABLE";
    readonly INVENTORY: "INVENTORY";
    readonly GRNI: "GRNI";
    readonly COGS: "COGS";
    readonly RETAINED_EARNINGS: "RETAINED_EARNINGS";
    readonly OPENING_BALANCE_EQUITY: "OPENING_BALANCE_EQUITY";
    readonly UNDEPOSITED_FUNDS: "UNDEPOSITED_FUNDS";
    readonly BANK_FEES: "BANK_FEES";
    readonly ACCUM_DEPRECIATION: "ACCUM_DEPRECIATION";
    readonly DEPRECIATION: "DEPRECIATION";
    readonly FX_GAIN: "FX_GAIN";
    readonly FX_LOSS: "FX_LOSS";
    readonly BAD_DEBT: "BAD_DEBT";
    readonly INVENTORY_ADJUSTMENT: "INVENTORY_ADJUSTMENT";
    readonly ROUNDING: "ROUNDING";
    readonly CREDIT_CARD: "CREDIT_CARD";
};
export declare const CONTROL_ACCOUNT_TAGS: Set<"INVENTORY" | "RETAINED_EARNINGS" | "AR" | "TAX_RECEIVABLE" | "GRNI" | "AP" | "TAX_PAYABLE" | "OPENING_BALANCE_EQUITY">;
