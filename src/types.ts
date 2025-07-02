import { CsFloatTransactionType, Rarity } from "./enums";

export type CsFloatOptions = CsFloatApiKeyOptions | CsFloatSessionOptions;
export interface CsFloatOptionsBase {
    baseUrl?: string;
    updateUserEvery?: number;

}
export interface CsFloatApiKeyOptions extends CsFloatOptionsBase {
    apiKey: string;
}
export interface CsFloatSessionOptions extends CsFloatOptionsBase {
    session: string;
}

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}


export interface ICsFloatMeResponse {
    user: {
        steam_id: string;
        username: string;
        flags: number;
        avatar: string;
        background_url: string;
        email: string;
        balance: number;
        pending_balance: number;
        stall_public: boolean;
        away: boolean;
        trade_token: string;
        payment_accounts?: {
            stripe_connect: string;
            stripe_customer: string;
        };
        statistics: {
            total_sales: number;
            total_purchases: number;
            median_trade_time: number;
            total_avoided_trades: number;
            total_failed_trades: number;
            total_verified_trades: number;
            total_trades: number;
        };
        preferences: {
            offers_enabled: boolean | null;
            max_offer_discount: number;
        };
        know_your_customer: 'approved' | 'pending' | 'rejected' | string;
        extension_setup_at: string;
        firebase_messaging: {
            platform: string | null;
            last_updated: string | null;
        };
        stripe_connect?: {
            payouts_enabled: boolean;
        };
        has_valid_steam_api_key: boolean;
        obfuscated_id: string;
        online: boolean;
        fee: number;
        withdraw_fee: number;
        subscriptions: any[]; // если появятся типы — уточним
        has_2fa: boolean;
        has_api_key: boolean;
    };
    pending_offers: number;
    actionable_trades: number;
    has_unread_notifications: boolean;
}
export interface ICsFloatAccountStandingResponse {
    standing: 'excellent' | 'good' | 'poor' | 'at_risk' | 'banned';
    penalty_progress: number;
    recent_restrictions: any[];
}

export interface ICsFloatListingsResponse {
    data: IListingEntry[];
}

export interface IListingEntry {
    id: string;
    created_at: string;
    type: 'auction' | 'buy_now';
    price: number;
    description?: string;
    state: 'listed' | 'sold' | 'cancelled';
    seller: ISeller;
    reference: IReference;
    item: IItem;
    is_seller: boolean;
    min_offer_price: number;
    max_offer_discount: number;
    is_watchlisted: boolean;
    watchers: number;
    auction_details?: IAuctionDetails;
}

export interface ISeller {
    avatar?: string;
    away: boolean;
    flags: number;
    has_valid_steam_api_key: boolean;
    online: boolean;
    stall_public: boolean;
    steam_id?: string;
    username?: string;
    obfuscated_id?: string;
    statistics: ISellerStatistics;
}

export interface ISellerStatistics {
    median_trade_time: number;
    total_avoided_trades: number;
    total_failed_trades: number;
    total_trades: number;
    total_verified_trades: number;
}

export interface IReference {
    base_price: number;
    float_factor: number;
    predicted_price: number;
    quantity: number;
    last_updated: string;
}

export interface IItem {
    asset_id: string;
    def_index: number;
    paint_index: number;
    paint_seed: number;
    float_value: number;
    icon_url: string;
    d_param: string;
    is_stattrak: boolean;
    is_souvenir: boolean;
    rarity: number;
    quality: number;
    market_hash_name: string;
    low_rank?: number;
    high_rank?: number;
    tradable: number;
    inspect_link: string;
    cs2_screenshot_id: string;
    cs2_screenshot_at: string;
    is_commodity: boolean;
    type: string;
    rarity_name: string;
    type_name: string;
    item_name: string;
    wear_name: string;
    phase?: string;
    description: string;
    serialized_inspect: string;
    gs_sig: string;
    blue_gem?: IBlueGemStats;
    stickers: ISticker[];
    collection?: string;
}

export interface IBlueGemStats {
    backside_blue: number;
    backside_purple: number;
    backside_gold: number;
    playside_blue: number;
    playside_purple: number;
    playside_gold: number;
}

export interface IAuctionDetails {
    reserve_price: number;
    top_bid: IAuctionBid;
    expires_at: string;
    min_next_bid: number;
}

export interface IAuctionBid {
    id: string;
    created_at: string;
    price: number;
    contract_id: string;
    state: string;
    obfuscated_buyer_id: string;
}
export type IStickerFilter =
    | { i: number; s?: number }
    | { c: string; s?: number };

export interface IGetListingsParams {
    limit?: number;
    min_ref_qty?: number;
    min_float?: number;
    max_float?: number;
    def_index?: number;
    paint_index?: number;
    paint_seed?: number;
    category?: number;
    rarity?: number;
    collection?: string;
    type?: 'auction' | 'buy_now';
    min_price?: number;
    max_price?: number;
    min_keychain_pattern?: number;
    max_keychain_pattern?: number;
    min_blue?: number;
    max_blue?: number;
    min_fade?: number;
    max_fade?: number;
    filter?: 'sticker_combos' | 'unique';
    sort_by?: "expires_soon" | "num_bids" | "float_rank" | "highest_float" | "lowest_float" | "highest_price" | "lowest_price" | "most_recent" | "highest_discount"
    sticker_option?: 'skins' | 'keychains' | 'packages';
    stickers?: IStickerFilter[];
    keychains?: { i: number }[];
    market_hash_name?: string;
    cursor?: string;
}


export type IBuyOrder =
    | {
        id: string;
        created_at: string;
        expression: string;
        qty: number;
        price: number;
        market_hash_name?: never;
    }
    | {
        id: string;
        created_at: string;
        market_hash_name: string;
        qty: number;
        price: number;
        expression?: never;
    };

export interface ISimilarItemEntry {
    id: string;
    created_at: string;
    type: 'buy_now' | 'auction';
    price: number;
    state: 'listed' | 'sold' | 'cancelled';
    seller: ISellerWithoutName;
    reference: IReference;
    item: ISimilarItem;
    is_seller: boolean;
    is_watchlisted: boolean;
    watchers: number;
}

export interface ISellerWithoutName {
    away: boolean;
    flags: number;
    has_valid_steam_api_key: boolean;
    obfuscated_id: string;
    online: boolean;
    stall_public: boolean;
    statistics: ISellerStatistics;
}
export interface ISimilarItem extends IItem {
}
export interface ISticker {
    stickerId: number;
    slot: number;
    icon_url: string;
    name: string;
    reference: {
        price: number;
        quantity: number;
        updated_at: string;
    };
}

export interface IItemHistoryEntry {
    avg_price: number;
    count: number;
    day: string
}

export interface ISalesItem {
    price: number;
    sold_at: string;
    item: ISaleItem;
}
export interface ISaleItem extends Omit<IItem, 'stickers'> {
    stickers?: ISaleSticker[];
}
export interface ISaleSticker {
    stickerId: number;
    slot: number;
    icon_url: string;
    name: string;
}
export type ISalesItemsResponse = ISalesItem[];

export interface IBitItemResponse {
    contract_id: string;
    created_at: string;
    id: string;
    max_price: number;
}

export interface ITransactionsResponse {
    transactions: Array<IDepositTransaction | IContractPurchasedTransaction | ITransactionUnknown | IBidPostedTransaction>;
    count: number;
}

export interface ITransactionBasic {
    id: string;
    created_at: string;
    user_id: string;
    balance_offset: number;
    pending_offset: number;
}
export interface ITransactionUnknown extends ITransactionBasic {
    type: CsFloatTransactionType.Unknown;
    details: Record<string, any>;
}



export interface IDepositTransaction extends ITransactionBasic {
    type: CsFloatTransactionType.Deposit;
    details: {
        fee: string;
        payment_method: string;
        payment_processor: string;
        session_id: string;
    };
}
export interface IWithdrawalTransaction extends ITransactionBasic {
    type: CsFloatTransactionType.Withdrawal;
    details: {
        fee: string;
        payment_method: string;
        payment_processor: string;
        session_id: string;
    };
}
export interface IContractPurchasedTransaction extends ITransactionBasic {
    type: CsFloatTransactionType.ContractPurchased;
    details: {
        contract_id: string;
    };
}

export interface IBidPostedTransaction extends ITransactionBasic {
    type: CsFloatTransactionType.BidPosted;
    details: {
        bid_id: string;
        listing_id: string;
    };
}


export interface IBuyOrderBase {
    id: string;
    created_at: string;
    qty: number;
    price: number;
    bought_item_count: number;
}
export type IBuyOrderMarketHashName = IBuyOrderBase & {
    market_hash_name: string;
    expression?: never;
};
export type IBuyOrderExpression = IBuyOrderBase & {
    market_hash_name?: never;
    expression: string;
};

export type Operator = '==' | '>' | '<' | 'has';

export interface IExpressionRule {
    field: string;
    operator: Operator;
    value: {
        constant?: string;
        sticker?: {
            id: number;
            qty: number;
        };
    };
}

export interface IExpressionGroup {
    condition: 'and' | 'or';
    rules: (IExpressionRule | IExpressionGroup)[];
}

export const RarityNameMap: Record<string, Rarity> = {
    consumer: Rarity.Consumer,
    industrial: Rarity.Industrial,
    'mil-spec': Rarity.MilSpec,
    restricted: Rarity.Restricted,
    classified: Rarity.Classified,
    covert: Rarity.Covert,
    contraband: Rarity.Contraband,
};

export type IAutoBitsResponse = {
    id: string,
    created_at: string,
    max_price: number,
    contract_id: string
}[];

export type getTradesRequestOptions = getTradesRequestOptionsAsSeller | getTradesRequestOptionsAsBuyer;
export type TradesStatus = "failed" | "cancelled" | "verified" | "queued" | "pending";


export interface getTradesRequestOptionsBase {
    page?: number;
    limit?: number;
    state?: TradesStatus[];
    role?: unknown;
}
export interface getTradesRequestOptionsAsSeller extends getTradesRequestOptionsBase {
    role?: 'seller';
}
export interface getTradesRequestOptionsAsBuyer extends getTradesRequestOptionsBase {
    role?: 'buyer';
}

export interface ITradeOfferResponse {
    trades: ITradeOffer[];
    count: number;
}
export interface ITradeOffer {
    id: string;
    created_at: string;
    buyer_id: string;
    buyer: ISeller;
    seller_id: string;
    seller: ISeller;
    contract_id: string;
    state: TradesStatus | string;
    verification_mode: string;
    steam_offer: ISteamTradeOffer;
    manual_verification: boolean;
    manual_verification_at: string | null;
    inventory_check_status: number;
    contract: IListingEntry;
    trade_url: string;
    trade_token: string;
    wait_for_cancel_ping: boolean;
}
export interface ISteamTradeOffer {
    is_from_seller: boolean,
    sent_at: string | null,
    deadline_at: string | null,
    updated_at: string | null
}

export type ISaleItemParams = ISaleItemAuction | ISaleItemBuyNow;

export interface ISaleItemBase {
    asset_id: string;
    type: 'auction' | 'buy_now';
    description: string;
    private: boolean;
}
export interface ISaleItemAuction extends ISaleItemBase {
    type: 'auction';
    reserve_price: number;
    duration_days: number;
}
export interface ISaleItemBuyNow extends ISaleItemBase {
    type: 'buy_now';
    price: number;
}

export type ISaleListingResponse = ISaleListingBuyNow | ISaleListingAuction;
export interface ISaleListingBase {
    id: string;
    created_at: string;
    price: number;
    private?: boolean;
    description?: string;
    state: 'listed' | 'sold' | 'cancelled';
    seller: ISeller;
    reference: IReference;
    item: IItem;
    is_seller: boolean;
    is_watchlisted: boolean;
    watchers: number;
}
export interface ISaleListingBuyNow extends ISaleListingBase {
    type: 'buy_now';
}
export interface ISaleListingAuction extends ISaleListingBase {
    type: 'auction';
    auction_details: {
        reserve_price: number;
        expires_at: string;
        min_next_bid: number;
    }
}

export interface IInventoryItemReference {
    base_price: number;
    float_factor?: number;
    predicted_price: number;
    quantity: number;
    last_updated: string; // ISO string
}

export interface IInventoryItem {
    asset_id: string;
    def_index: number;
    paint_index?: number;
    paint_seed?: number;
    float_value?: number;
    icon_url: string;
    d_param?: string;
    is_stattrak?: boolean;
    is_souvenir?: boolean;
    rarity: number;
    quality?: number;
    market_hash_name: string;
    tradable: number;
    inspect_link?: string;
    is_commodity: boolean;
    type: string; // e.g., "skin", "container"
    rarity_name: string;
    type_name: string;
    item_name: string;
    wear_name?: string;
    description?: string;
    collection?: string;
    reference: IInventoryItemReference;
    serialized_inspect?: string;
    gs_sig?: string;
}

export type IInventoryResponse = IInventoryItem[];


export interface IOffersResponse {
    offers: IOfferItem[];
}
export interface IOfferItem {
    id: string;
    created_at: string;
    expires_at: string;
    buyer_id: string;
    buyer: ISeller;
    seller_id: string;
    seller: ISeller;
    contract_id: string;
    contract_price: number;
    price: number;
    type: 'seller_offer' | 'buyer_offer';
    contract: IListingEntry;
    state: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

export interface IOfferHistory {
    id: string,
    created_at: string,
    expires_at: string,
    contract_id: string,
    contract_price: number,
    buyer_id: string,
    price: number,
    type: "seller_offer" | "buyer_offer",
    state: "accepted" | "rejected" | "pending"
}

export interface INotificationsResponse {
    data: INotification[];
    cursor: string
}

export interface INotification {
    body: string;
    created_at: string;
    notification_id: string;
    redirect_path: string;
    title: string;
    type: "offer_added" | "sold_contract" | "bought_contract" | "tos_pp_update" | "price_drop" | "deposit_success" | "deposit_fail" | "buyer_verified_trade" | "sumsub" | string;
}

export const HttpStatusMessages: Record<number, string> = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
};

export const CSFloatErrorCodes: Record<number, string | { message: string }[]> = {
    4: [{
        message: 'you can only place buy orders on commodities that have been listed on CSFloat before',
    }, {
        message: 'missing partner id or token in trade url',
    }],
    28: 'failed to validate token',
    82: 'invalid api key',
    88: 'your buy order is too complex, please simplify it or break it up into separate orders'
}