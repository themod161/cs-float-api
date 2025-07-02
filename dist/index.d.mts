import { AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';

interface IRateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

type CsFloatOptions = CsFloatApiKeyOptions | CsFloatSessionOptions;
interface CsFloatOptionsBase {
    baseUrl?: string;
    updateUserEvery?: number;
}
interface CsFloatApiKeyOptions extends CsFloatOptionsBase {
    apiKey: string;
}
interface CsFloatSessionOptions extends CsFloatOptionsBase {
    session: string;
}
interface ICsFloatMeResponse {
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
        subscriptions: any[];
        has_2fa: boolean;
        has_api_key: boolean;
    };
    pending_offers: number;
    actionable_trades: number;
    has_unread_notifications: boolean;
}
interface ICsFloatAccountStandingResponse {
    standing: 'excellent' | 'good' | 'poor' | 'at_risk' | 'banned';
    penalty_progress: number;
    recent_restrictions: any[];
}
interface ICsFloatListingsResponse {
    data: IListingEntry[];
}
interface IListingEntry {
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
interface ISeller {
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
interface ISellerStatistics {
    median_trade_time: number;
    total_avoided_trades: number;
    total_failed_trades: number;
    total_trades: number;
    total_verified_trades: number;
}
interface IReference {
    base_price: number;
    float_factor: number;
    predicted_price: number;
    quantity: number;
    last_updated: string;
}
interface IItem {
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
interface IBlueGemStats {
    backside_blue: number;
    backside_purple: number;
    backside_gold: number;
    playside_blue: number;
    playside_purple: number;
    playside_gold: number;
}
interface IAuctionDetails {
    reserve_price: number;
    top_bid: IAuctionBid;
    expires_at: string;
    min_next_bid: number;
}
interface IAuctionBid {
    id: string;
    created_at: string;
    price: number;
    contract_id: string;
    state: string;
    obfuscated_buyer_id: string;
}
type IStickerFilter = {
    i: number;
    s?: number;
} | {
    c: string;
    s?: number;
};
interface IGetListingsParams {
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
    sort_by?: "expires_soon" | "num_bids" | "float_rank" | "highest_float" | "lowest_float" | "highest_price" | "lowest_price" | "most_recent" | "highest_discount";
    sticker_option?: 'skins' | 'keychains' | 'packages';
    stickers?: IStickerFilter[];
    keychains?: {
        i: number;
    }[];
    market_hash_name?: string;
    cursor?: string;
}
type IBuyOrder = {
    id: string;
    created_at: string;
    expression: string;
    qty: number;
    price: number;
    market_hash_name?: never;
} | {
    id: string;
    created_at: string;
    market_hash_name: string;
    qty: number;
    price: number;
    expression?: never;
};
interface ISimilarItemEntry {
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
interface ISellerWithoutName {
    away: boolean;
    flags: number;
    has_valid_steam_api_key: boolean;
    obfuscated_id: string;
    online: boolean;
    stall_public: boolean;
    statistics: ISellerStatistics;
}
interface ISimilarItem extends IItem {
}
interface ISticker {
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
interface IItemHistoryEntry {
    avg_price: number;
    count: number;
    day: string;
}
interface ISalesItem {
    price: number;
    sold_at: string;
    item: ISaleItem;
}
interface ISaleItem extends Omit<IItem, 'stickers'> {
    stickers?: ISaleSticker[];
}
interface ISaleSticker {
    stickerId: number;
    slot: number;
    icon_url: string;
    name: string;
}
type ISalesItemsResponse = ISalesItem[];
interface IBitItemResponse {
    contract_id: string;
    created_at: string;
    id: string;
    max_price: number;
}
interface IBuyOrderBase {
    id: string;
    created_at: string;
    qty: number;
    price: number;
    bought_item_count: number;
}
type IBuyOrderMarketHashName = IBuyOrderBase & {
    market_hash_name: string;
    expression?: never;
};
type IBuyOrderExpression = IBuyOrderBase & {
    market_hash_name?: never;
    expression: string;
};
type IAutoBitsResponse = {
    id: string;
    created_at: string;
    max_price: number;
    contract_id: string;
}[];
type getTradesRequestOptions = getTradesRequestOptionsAsSeller | getTradesRequestOptionsAsBuyer;
type TradesStatus = "failed" | "cancelled" | "verified" | "queued" | "pending";
interface getTradesRequestOptionsBase {
    page?: number;
    limit?: number;
    state?: TradesStatus[];
    role?: unknown;
}
interface getTradesRequestOptionsAsSeller extends getTradesRequestOptionsBase {
    role?: 'seller';
}
interface getTradesRequestOptionsAsBuyer extends getTradesRequestOptionsBase {
    role?: 'buyer';
}
interface ITradeOfferResponse {
    trades: ITradeOffer[];
    count: number;
}
interface ITradeOffer {
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
interface ISteamTradeOffer {
    is_from_seller: boolean;
    sent_at: string | null;
    deadline_at: string | null;
    updated_at: string | null;
}
type ISaleItemParams = ISaleItemAuction | ISaleItemBuyNow;
interface ISaleItemBase {
    asset_id: string;
    type: 'auction' | 'buy_now';
    description: string;
    private: boolean;
}
interface ISaleItemAuction extends ISaleItemBase {
    type: 'auction';
    reserve_price: number;
    duration_days: number;
}
interface ISaleItemBuyNow extends ISaleItemBase {
    type: 'buy_now';
    price: number;
}
type ISaleListingResponse = ISaleListingBuyNow | ISaleListingAuction;
interface ISaleListingBase {
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
interface ISaleListingBuyNow extends ISaleListingBase {
    type: 'buy_now';
}
interface ISaleListingAuction extends ISaleListingBase {
    type: 'auction';
    auction_details: {
        reserve_price: number;
        expires_at: string;
        min_next_bid: number;
    };
}
interface IInventoryItemReference {
    base_price: number;
    float_factor?: number;
    predicted_price: number;
    quantity: number;
    last_updated: string;
}
interface IInventoryItem {
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
    type: string;
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
interface IOffersResponse {
    offers: IOfferItem[];
}
interface IOfferItem {
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
interface IOfferHistory {
    id: string;
    created_at: string;
    expires_at: string;
    contract_id: string;
    contract_price: number;
    buyer_id: string;
    price: number;
    type: "seller_offer" | "buyer_offer";
    state: "accepted" | "rejected" | "pending";
}
interface INotificationsResponse {
    data: INotification[];
    cursor: string;
}
interface INotification {
    body: string;
    created_at: string;
    notification_id: string;
    redirect_path: string;
    title: string;
    type: "offer_added" | "sold_contract" | "bought_contract" | "tos_pp_update" | "price_drop" | "deposit_success" | "deposit_fail" | "buyer_verified_trade" | "sumsub" | string;
}

type EqualityOperator = '==' | '!=';
type ComparisonOperator = '>' | '>=' | '<' | '<=';
type HasOperator = 'has';
type Operator = EqualityOperator | ComparisonOperator | HasOperator;
interface IExpressionRule {
    field: string;
    operator: Operator;
    value: {
        constant?: string;
        sticker?: {
            id: number;
            qty?: number;
            slot?: number;
        };
    };
}
interface IExpressionGroup {
    condition: 'and' | 'or';
    rules: (IExpressionRule | {
        expression: IExpressionGroup;
    })[];
}

interface CsFloatClientEvents {
    'api:UpdateMe': ICsFloatMeResponse;
    'api:UpdateListings': IListingEntry[];
    'api:UpdateInventory': IInventoryItem[];
    'api:UpdateTradeOfferUrl': {
        trade_url: string;
        message: string;
    };
    'api:ReadNotification': {
        notificationId: string;
        message: string;
    };
    'api:UpdateNotifications': INotificationsResponse;
    'api:UpdateOfferHistory': {
        offerId: string;
        history: IOfferHistory[];
    };
    'api:UpdateOffersTimeline': IOffersResponse;
    'api:UpdateStall': IListingEntry[];
    'api:UpdateSaleItem': ISaleListingResponse;
    'api:BuyItems': {
        message: string;
    }[];
    'api:CancelTrades': ITradeOffer[];
    'api:AcceptTrades': ITradeOffer[];
    'api:UpdateAutoBits': IAutoBitsResponse;
    'api:UpdateMaxBargain': {
        maxBargain: number;
        message: string;
    };
    'api:UpdateBargainStatus': {
        status: boolean;
        message: string;
    };
    'api:UpdatePrivacyStall': {
        isPublic: boolean;
        message: string;
    };
    'api:UpdateAwayStall': {
        isAway: boolean;
        message: string;
    };
    'api:UpdateBuyOrders': IBuyOrder[];
    'api:UpdateAccountStanding': ICsFloatAccountStandingResponse;
    'api:UpdateTrades': ITradeOfferResponse;
    'api:UpdateBuyOrderDetails': IBuyOrder;
    'api:UpdateMeEvery': ICsFloatMeResponse;
    'rateLimit:Update': (key: string, info: {
        limit: number;
        remaining: number;
        reset: number;
    }) => void;
    'error': Error;
    'api:VerifySms': {
        message: string;
    };
    'api:UpdateListingBuyOrders': {
        listingId: number;
        buyOrders: IBuyOrder[];
    };
    'api:UpdateSalesItems': {
        listingId: number;
        salesItems: ISalesItemsResponse;
    };
    'api:UpdateSimilarItems': {
        listingId: number;
        similarItems: ISimilarItemEntry[];
    };
    'api:UpdateListing': IListingEntry;
    'api:UpdateItemHistory': {
        market_hash_name: number;
        paint_index: number;
        history: IItemHistoryEntry[];
    };
    'api:UpdateBitItem': IBitItemResponse;
    'api:UpdateBitItemHistory': {
        market_hash_name: string;
        history: IItemHistoryEntry[];
    };
    'api:UpdateMobileStatus': {
        status: boolean;
        message: string;
    };
    'api:BitItem': IBitItemResponse;
    'api:UpdateTradeOffer': ITradeOffer;
    'api:NewTradeOffer': ITradeOffer;
}
type EventArgs<K extends keyof CsFloatClientEvents> = CsFloatClientEvents[K] extends (...args: infer A) => any ? A : [CsFloatClientEvents[K]];
declare class CsFloatClient extends EventEmitter {
    private options;
    private client;
    private rateLimiter;
    user: ICsFloatMeResponse | null;
    private updateInterval;
    private updateMeEvery;
    private cache;
    constructor(options: CsFloatOptions);
    emit<K extends keyof CsFloatClientEvents>(eventName: K, ...args: EventArgs<K>): boolean;
    on<K extends keyof CsFloatClientEvents>(event: K, listener: (payload: CsFloatClientEvents[K]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    private startUpdateMeInterval;
    private stopUpdateMeInterval;
    get<T = any>(path: string, params?: Record<string, any> & {
        refererUrl?: string;
    } & {
        key?: string;
    }): Promise<T>;
    post<T = any>(path: string, data?: any, options?: AxiosRequestConfig & {
        key: string;
    }): Promise<T>;
    put<T = any>(path: string, data?: any, options?: AxiosRequestConfig & {
        key: string;
    }): Promise<T>;
    patch<T = any>(path: string, data?: any, options?: AxiosRequestConfig & {
        key: string;
    }): Promise<T>;
    delete<T = any>(path: string, options?: AxiosRequestConfig & {
        key: string;
    }): Promise<T>;
    getAccountStanding(): Promise<ICsFloatAccountStandingResponse>;
    getBuyOrders(page?: number, limit?: number, order?: 'asc' | 'desc'): Promise<{
        count: number;
        orders: IBuyOrder[];
    }>;
    updateBuyOrderDetails(buyOrder: IBuyOrder, options?: {
        expression?: IExpressionGroup;
        max_price?: number;
        quantity?: number;
        market_hash_name?: string;
    }): Promise<IBuyOrderMarketHashName | IBuyOrderExpression>;
    deleteBuyOrder(orderId: string): Promise<{
        message: string;
    }>;
    getMe(): Promise<ICsFloatMeResponse>;
    placeBuyOrder(options: {
        expression: IExpressionGroup;
        max_price: number;
        quantity: number;
    } | {
        market_hash_name: string;
        max_price: number;
        quantity: number;
    }): Promise<IBuyOrderExpression | IBuyOrderMarketHashName>;
    getAutoBits(): Promise<IAutoBitsResponse>;
    changeMaxBargain(number: number): Promise<{
        message: string;
    }>;
    setBargainStatus(status: boolean): Promise<{
        message: string;
    }>;
    setPrivacyStall(isPublic: boolean): Promise<{
        message: string;
    }>;
    setAwayStall(isAway: boolean): Promise<{
        message: string;
    }>;
    getTrades(options?: getTradesRequestOptions): Promise<ITradeOfferResponse>;
    acceptTrades(trade_ids: string[]): Promise<{
        data: ITradeOffer[];
    }>;
    cancelTrades(trade_ids: string[]): Promise<{
        data: ITradeOffer[];
    }>;
    buyItems(contract_ids: string[], total_price: number): Promise<{
        message: string;
    }[]>;
    sellItem(data: ISaleItemParams): Promise<ISaleListingResponse>;
    getInventory(): Promise<IInventoryItem[]>;
    getStore(userId: string, params?: IGetListingsParams): Promise<IListingEntry[]>;
    getStall(userId: string, params?: IGetListingsParams): Promise<IListingEntry[]>;
    getOffersTimeLine(limit?: number): Promise<IOffersResponse>;
    getOfferHistory(offerId: string): Promise<IOfferHistory[]>;
    getNotifications(): Promise<INotificationsResponse>;
    readNotification(notificationId: string): Promise<{
        message: string;
    }>;
    updateTradeOfferUrl(trade_url: string): Promise<{
        message: string;
    }>;
    verifySms(phone_number: string, token?: string): Promise<{
        message: string;
    }>;
    private parseParams;
    getListings(params?: IGetListingsParams): Promise<ICsFloatListingsResponse>;
    getListingBuyOrders(listingId: number, limit?: number): Promise<IBuyOrder[]>;
    getListingSales(listingId: number): Promise<ISalesItemsResponse>;
    getListingSimilar(listingId: number): Promise<void>;
    getItemHistory(market_hash_name: number, paint_index: number): Promise<IItemHistoryEntry[]>;
    bitItem(listingId: number, max_price: number): Promise<IBitItemResponse>;
    getMobileStatus(): Promise<any>;
    newTradeOffer(options: {
        given_asset_ids: string[];
        offer_id: string;
        received_asset_ids: string[];
    }): Promise<ITradeOffer>;
    updateTradeOffer(options: {
        sent_offers: {
            offer_id: string;
            state: number;
            given_asset_ids: string[];
            received_asset_ids: string[];
            time_created: number;
            time_updated: number;
            other_steam_id64: string;
        }[];
        type: number;
    }): Promise<ITradeOffer>;
    setMobileStatus(status: boolean): Promise<{
        message: string;
    }>;
    changeListingPrice(listingId: string, newPrice: number): Promise<IListingEntry>;
    getListingById(listingId: number): Promise<IListingEntry>;
    getRateLimit(key?: string): IRateLimitInfo | undefined;
    getRateLimits(): {
        limits: {
            reset_in: number;
            reset_in_string: string;
            limit: number;
            remaining: number;
            reset: number;
            key: string;
        }[];
        keys: string[];
    };
}

export { CsFloatClient, type CsFloatOptions };
