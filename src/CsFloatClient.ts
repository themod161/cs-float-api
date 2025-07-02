import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CsFloatOptions, getTradesRequestOptions, HttpStatusMessages, IAutoBitsResponse, IBitItemResponse, IBuyOrder, IBuyOrderExpression, IBuyOrderMarketHashName, ICsFloatAccountStandingResponse, ICsFloatListingsResponse, ICsFloatMeResponse, IGetListingsParams, IInventoryItem, IItemHistoryEntry, IListingEntry, INotificationsResponse, IOfferHistory, IOffersResponse, ISaleItemParams, ISaleListingResponse, ISalesItemsResponse, ISimilarItemEntry, ITradeOffer, ITradeOfferResponse } from './types';
import { RateLimiter } from './rateLimit';
import { BuyOrderExpressionBuilder, IExpressionGroup } from './BuyOrderExpressionBuilder';
import qs from 'qs';
import { EventEmitter } from "events";

export interface CsFloatClientEvents {
    'api:UpdateMe': ICsFloatMeResponse;
    'api:UpdateListings': IListingEntry[];
    'api:UpdateInventory': IInventoryItem[];
    'api:UpdateTradeOfferUrl': { trade_url: string; message: string };
    'api:ReadNotification': { notificationId: string; message: string };
    'api:UpdateNotifications': INotificationsResponse;
    'api:UpdateOfferHistory': { offerId: string; history: IOfferHistory[] };
    'api:UpdateOffersTimeline': IOffersResponse;
    'api:UpdateStall': IListingEntry[];
    'api:UpdateSaleItem': ISaleListingResponse;
    'api:BuyItems': { message: string }[];
    'api:CancelTrades': ITradeOffer[];
    'api:AcceptTrades': ITradeOffer[];
    'api:UpdateAutoBits': IAutoBitsResponse;
    'api:UpdateMaxBargain': { maxBargain: number; message: string };
    'api:UpdateBargainStatus': { status: boolean; message: string };
    'api:UpdatePrivacyStall': { isPublic: boolean; message: string };
    'api:UpdateAwayStall': { isAway: boolean; message: string };
    'api:UpdateBuyOrders': IBuyOrder[];
    'api:UpdateAccountStanding': ICsFloatAccountStandingResponse;
    'api:UpdateTrades': ITradeOfferResponse;
    'api:UpdateBuyOrderDetails': IBuyOrder;
    'api:UpdateMeEvery': ICsFloatMeResponse;
    'rateLimit:Update': (key: string, info: { limit: number; remaining: number; reset: number }) => void;
    'error': Error;
    'api:VerifySms': { message: string };
    'api:UpdateListingBuyOrders': {
        listingId: number;
        buyOrders: IBuyOrder[];
    }
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

type EventArgs<K extends keyof CsFloatClientEvents> =
    CsFloatClientEvents[K] extends (...args: infer A) => any ? A
    : [CsFloatClientEvents[K]];

export class CsFloatClient extends EventEmitter {
    private client: AxiosInstance;
    private rateLimiter = new RateLimiter();
    public user: ICsFloatMeResponse | null = null;
    private updateInterval: NodeJS.Timeout | null = null;

    private updateMeEvery: number | null = null;

    private cache: {
        me: ICsFloatMeResponse | null;
        accountStanding: ICsFloatAccountStandingResponse | null;
        buyOrders: IBuyOrder[] | null;
        autoBits: IAutoBitsResponse | null;
        trades: ITradeOfferResponse | null;
        notifications: INotificationsResponse | null;
        inventory: IInventoryItem[] | null;
        listings: { [key: string]: IListingEntry } | null;
        itemHistory: { [key: string]: IItemHistoryEntry[] } | null;
    } = {
            me: null,
            accountStanding: null,
            buyOrders: null,
            autoBits: null,
            trades: null,
            notifications: null,
            inventory: null,
            listings: null,
            itemHistory: null
        };

    constructor(private options: CsFloatOptions) {
        super();
        this.client = axios.create({
            baseURL: options.baseUrl ?? 'https://csfloat.com',
            headers: "apiKey" in options
                ? { Authorization: `${options.apiKey}` }
                : { Cookie: `session=${options.session}` }
        });
        this.updateMeEvery = options.updateUserEvery ?? null;
    }
    public override emit<K extends keyof CsFloatClientEvents>(
        eventName: K,
        ...args: EventArgs<K>
    ): boolean {
        return super.emit(eventName, ...args);
    }
    public override on<K extends keyof CsFloatClientEvents>(event: K, listener: (payload: CsFloatClientEvents[K]) => void): this {
        if (event === 'api:UpdateMe' && this.listenerCount(event) === 0) {
            if (!this.updateMeEvery) {
                this.updateMeEvery = 60000;
            }
            this.startUpdateMeInterval();
        }
        if (event === 'rateLimit:Update') {
            this.rateLimiter.on('update', (key, info) => {
                this.emit('rateLimit:Update', key, info);
            });
        }

        super.on(event, listener);

        return this;
    }

    public override off(event: string, listener: (...args: any[]) => void): this {
        super.off(event, listener);

        if (event === 'api:UpdateMe' && this.listenerCount(event) === 0) {
            this.stopUpdateMeInterval();
        }

        return this;
    }

    private startUpdateMeInterval() {
        if (this.updateInterval) return;

        const fetchMe = async () => {
            const me = await this.getMe().catch((error) => {
                this.emit('error', error);
                return null;
            });
        };

        fetchMe();

        this.updateInterval = setInterval(() => {
            fetchMe();
        }, this.updateMeEvery || 60000);
    }

    private stopUpdateMeInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    async get<T = any>(
        path: string,
        params?: Record<string, any> & { refererUrl?: string } & { key?: string }
    ): Promise<T> {
        try {
            const { refererUrl, key, ...query } = params || {};
            const headers: Record<string, string> = {};

            if (refererUrl) {
                headers.referer = refererUrl;
            }

            const response = await this.client.get<T>(path, {
                params: query,
                headers,
                paramsSerializer: {
                    serialize: (params: any) => {
                        // Преобразуем state: ['failed', 'queued'] → state=failed,queued
                        const modified = { ...params };

                        if (Array.isArray(modified.state)) {
                            modified.state = modified.state.join(',');
                        }

                        return qs.stringify(modified, { encode: true });
                    }
                }
            });

            this.rateLimiter.update(response.headers, key || 'main');
            return response.data;
        } catch (error: any) {

            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data || new Error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
            } else {
                // Handle other errors
                throw error instanceof Error ? error : new Error('An unknown error occurred');
            }
        }
    }
    async post<T = any>(
        path: string,
        data?: any,
        options: AxiosRequestConfig & { key: string } = { key: 'main' }
    ): Promise<T> {
        try {
            const response = await this.client.post<T>(path, data, options);
            this.rateLimiter.update(response.headers, options.key);
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] } || new Error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
            } else {
                // Handle other errors
                throw error instanceof Error ? error : new Error('An unknown error occurred');
            }
        }
    }
    async put<T = any>(
        path: string,
        data?: any,
        options: AxiosRequestConfig & { key: string } = { key: 'main' }
    ): Promise<T> {
        try {
            const response = await this.client.put<T>(path, data, options);
            this.rateLimiter.update(response.headers, options.key);
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] } || new Error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
            } else {
                throw error instanceof Error ? error : new Error('An unknown error occurred');
            }
        }
    }
    async patch<T = any>(
        path: string,
        data?: any,
        options: AxiosRequestConfig & { key: string } = { key: 'main' }
    ): Promise<T> {
        try {
            const response = await this.client.patch<T>(path, data, options);
            this.rateLimiter.update(response.headers, options.key);
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] } || new Error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
            } else {
                throw error instanceof Error ? error : new Error('An unknown error occurred');
            }
        }
    }
    async delete<T = any>(path: string, options: AxiosRequestConfig & { key: string } = { key: 'main' }): Promise<T> {
        try {
            const response = await this.client.delete<T>(path, options);
            this.rateLimiter.update(response.headers, options.key);
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] } || new Error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
            } else {
                throw error instanceof Error ? error : new Error('An unknown error occurred');
            }
        }
    }
    async getAccountStanding() {
        const path = '/api/v1/account-standing';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<ICsFloatAccountStandingResponse>(path, {
            key
        });
        this.cache.accountStanding = response;
        this.emit('api:UpdateAccountStanding', response);

        return response;
    }
    async getBuyOrders(page: number = 0, limit: number = 10, order: 'asc' | 'desc' = 'desc') {
        const path = `/api/v1/me/buy-orders`;
        const key = 'main';

        if (page < 0 || limit < 1) {
            console.warn('Page must be >= 0 and limit must be >= 1, defaulting to page 0 and limit 10');
            page = 0;
            limit = 10;
        }
        if (limit > 100) {
            console.warn('Limit must be <= 100, defaulting to 10');
            limit = 10;
        }
        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<{ count: number; orders: IBuyOrder[] }>(path, { refererUrl: 'https://csfloat.com/profile', page, limit, order, key });

        this.cache.buyOrders = response.orders;
        this.emit('api:UpdateBuyOrders', response.orders);

        return response;
    }

    async updateBuyOrderDetails(buyOrder: IBuyOrder, options:
        | { expression?: IExpressionGroup; max_price?: number; quantity?: number, market_hash_name?: string }
        = {}) {

        if (!buyOrder.id) {
            throw new Error('Buy order ID is required');
        }

        const useMarketHash = options.market_hash_name
            ?? (!options.expression && buyOrder.market_hash_name !== undefined)
            ?? false;

        const newBuyOrderData = {
            expression: useMarketHash
                ? undefined
                : options.expression
                ?? new BuyOrderExpressionBuilder(buyOrder.expression).buildExpression(),

            market_hash_name: useMarketHash
                ? options.market_hash_name ?? buyOrder.market_hash_name
                : undefined,

            max_price: options.max_price ?? buyOrder.price,
            quantity: options.quantity ?? buyOrder.qty,
        };
        if (newBuyOrderData.max_price < 0) {
            throw new Error('Max price must be a positive number');
        }
        if (newBuyOrderData.quantity < 0) {
            throw new Error('Quantity must be a positive number');
        }
        if (!newBuyOrderData.expression && !newBuyOrderData.market_hash_name) {
            throw new Error('Either expression or market_hash_name must be provided');
        }
        if (newBuyOrderData.expression && newBuyOrderData.market_hash_name) {
            throw new Error('Cannot provide both expression and market_hash_name');
        }
        if (newBuyOrderData.expression && typeof newBuyOrderData.expression !== 'object') {
            throw new Error('Expression must be an object');
        }
        if (!newBuyOrderData.market_hash_name) delete newBuyOrderData.market_hash_name;
        if (!newBuyOrderData.expression) delete newBuyOrderData.expression;

        const order = await this.deleteBuyOrder(buyOrder.id);
        if (order.message !== 'successfully removed the order') {
            throw new Error(`Failed to delete buy order: ${order.message}`);
        }
        this.cache.buyOrders = this.cache.buyOrders?.filter(o => o.id !== buyOrder.id) || [];

        const response = await this.placeBuyOrder(newBuyOrderData as { expression: IExpressionGroup; max_price: number; quantity: number; } | { market_hash_name: string; max_price: number; quantity: number; });
        if (!response || !('id' in response)) {
            throw new Error('Failed to place new buy order');
        }
        this.cache.buyOrders = this.cache.buyOrders || [];
        this.cache.buyOrders.push(response);
        this.emit('api:UpdateBuyOrders', this.cache.buyOrders);
        return response;
    }
    async deleteBuyOrder(orderId: string) {
        const path = `/api/v1/buy-orders/${orderId}`;
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.delete<{ message: string }>(path, {
            key
        });
        if (response.message !== 'successfully removed the order') {
            throw new Error(`Failed to delete buy order: ${response.message}`);
        }
        this.cache.buyOrders = this.cache.buyOrders?.filter(o => o.id !== orderId) || [];
        this.emit('api:UpdateBuyOrders', this.cache.buyOrders);

        return response;
    }
    async getMe() {
        const path = '/api/v1/me';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<ICsFloatMeResponse>(path, { refererUrl: 'https://csfloat.com/profile', key });

        this.user = response;
        this.cache.me = response;
        this.emit('api:UpdateMe', response);
        return response;
    }
    async placeBuyOrder(
        options:
            | { expression: IExpressionGroup; max_price: number; quantity: number }
            | { market_hash_name: string; max_price: number; quantity: number }
    ): Promise<IBuyOrderExpression | IBuyOrderMarketHashName> {
        const path = `/api/v1/buy-orders`;
        const key = 'buy_order';

        await this.rateLimiter.ensureAvailable(key);

        const request: {
            market_hash_name?: string;
            expression?: IExpressionGroup;
            max_price: number;
            quantity: number;
        } = {
            max_price: options.max_price,
            quantity: options.quantity,
        };

        if ('expression' in options) {
            request.expression = options.expression;
        } else {
            request.market_hash_name = options.market_hash_name;
        }

        const response = await this.post<
            'expression' extends keyof typeof request
            ? IBuyOrderExpression
            : IBuyOrderMarketHashName
        >(path, request, {
            key
        });

        this.cache.buyOrders = this.cache.buyOrders || [];
        this.cache.buyOrders.push(response);
        this.emit('api:UpdateBuyOrders', this.cache.buyOrders);
        return response;
    }

    async getAutoBits() {
        const path = '/api/v1/me/auto-bids';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<IAutoBitsResponse>(path, { refererUrl: 'https://csfloat.com/profile', key });

        this.cache.autoBits = response;
        this.emit('api:UpdateAutoBits', response);
        return response;
    }
    /**
        * Changes the maximum allowed bargain value.
        * 
        * @param number - The new max bargain value (percent). Must be a positive number.
        * @throws Will throw an error if the value is less than 0.
    */
    async changeMaxBargain(number: number) {
        const path = '/api/v1/me';
        const key = 'main';
        await this.rateLimiter.ensureAvailable(key);
        if (number < 0) {
            throw new Error('Max bargain must be a positive number');
        }
        if (number > 90) {
            throw new Error('Max bargain cannot be more than 90 percent');
        }
        const response = await this.patch<{ message: string }>(path, { max_offer_discount: number * 100 }, { key });
        this.emit('api:UpdateMaxBargain', {
            maxBargain: number,
            message: response.message
        });
        return response;
    }
    /**
     * Sets the bargain status for the user.
     * 
     * @param status - The new bargain status (true to enable, false to disable).
     * @returns A promise that resolves to the response message.
     */
    async setBargainStatus(status: boolean) {
        const path = '/api/v1/me';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.patch<{ message: string }>(path, { offers_enabled: status }, { key });
        this.emit('api:UpdateBargainStatus', {
            status,
            message: response.message
        });
        return response;
    }

    async setPrivacyStall(isPublic: boolean) {
        const path = '/api/v1/me';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.patch<{ message: string }>(path, { stall_public: isPublic }, { key });
        this.emit('api:UpdatePrivacyStall', {
            isPublic,
            message: response.message
        });
        return response;
    }

    async setAwayStall(isAway: boolean) {
        const path = '/api/v1/me';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.patch<{ message: string }>(path, { away: isAway }, { key });
        this.emit('api:UpdateAwayStall', {
            isAway,
            message: response.message
        });
        return response;
    }
    async getTrades(options: getTradesRequestOptions = {}) {
        const path = `/api/v1/me/trades`;
        const key = 'trades';
        if (options.state && new Set(options.state).size !== options.state.length) {
            throw new Error("Duplicate values in 'state' parameter");
        }

        if (options.page === undefined) {
            options.page = 0;
        }
        if (options.limit === undefined) {
            options.limit = 30;
        }

        await this.rateLimiter.ensureAvailable(key);
        const response = await this.get<ITradeOfferResponse>(path, { refererUrl: 'https://csfloat.com/profile', ...options, key });

        this.cache.trades = response;
        this.emit('api:UpdateTrades', response);
        return response;
    }
    async acceptTrades(trade_ids: string[]) {
        const path = `/api/v1/trades/bulk/accept`;
        const key = 'trades';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<{ data: ITradeOffer[] }>(path, { trade_ids }, { key });
        this.emit('api:AcceptTrades', response.data);
        return response;
    }
    async cancelTrades(trade_ids: string[]) {
        const path = `/api/v1/me/trades/bulk/cancel`;
        const key = 'trades';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<{ data: ITradeOffer[] }>(path, { trade_ids }, { key });
        this.emit('api:CancelTrades', response.data);
        return response;
    }
    async buyItems(contract_ids: string[], total_price: number) {
        const path = '/api/v1/listings/buy';
        const key = 'buy_items';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<{ message: string }[]>(path, { contract_ids, total_price }, { key });
        this.emit('api:BuyItems', response);
        return response;
    }
    async sellItem(data: ISaleItemParams) {
        const path = '/api/v1/listings/sell';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<ISaleListingResponse>(path, data, { key });
        this.emit('api:UpdateSaleItem', response);
        return response;
    }
    async getInventory() {
        const path = '/api/v1/me/inventory';
        const key = 'inventory';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<IInventoryItem[]>(path, { refererUrl: 'https://csfloat.com/profile', key });

        this.cache.inventory = response;
        this.emit('api:UpdateInventory', response);
        return response;
    }
    async getStore(userId: string, params: IGetListingsParams = {}) {
        return this.getStall(userId, params);
    }
    async getStall(userId: string, params: IGetListingsParams = {}): Promise<IListingEntry[]> {
        const path = `/api/v1/users/${userId}/stall`;
        const key = 'stall';
        if (params.limit === 0) {
            params.limit = 40; // Default limit if 0 is provided
        }
        if (params.limit && (params?.limit < 1 || params?.limit > 50)) {
            console.warn('Limit must be between 1 and 50, defaulting to 40');
            params.limit = 40; // Default value
        }
        await this.rateLimiter.ensureAvailable(key);
        const query = this.parseParams(params);

        const response = await this.get<IListingEntry[]>(path, { refererUrl: 'https://csfloat.com/profile', params: query, key });
        this.emit('api:UpdateStall', response);
        return response;
    }

    async getOffersTimeLine(limit: number = 40) {
        const path = '/api/v1/me/offers-timeline';
        const key = 'main';

        if (limit === 0) {
            limit = 40;
        }

        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
        if (limit % 1 !== 0) {
            throw new Error('Limit must be an integer');
        }

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<IOffersResponse>(path, { refererUrl: 'https://csfloat.com/profile', limit, key });
        this.emit('api:UpdateOffersTimeline', response);
        return response;
    }
    async getOfferHistory(offerId: string) {
        const path = `/api/v1/offers/${offerId}/history`;
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<IOfferHistory[]>(path, { refererUrl: 'https://csfloat.com/profile', key });
        this.emit('api:UpdateOfferHistory', {
            offerId,
            history: response
        });
        return response;
    }

    async getNotifications() {
        const path = '/api/v1/me/notifications/timeline';
        const key = 'notifications';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<INotificationsResponse>(path, { refererUrl: 'https://csfloat.com/profile', key });
        this.cache.notifications = response;
        this.emit('api:UpdateNotifications', response);
        return response;
    }
    async readNotification(notificationId: string) {
        const path = `/api/v1/me/notifications/read-receipt`;
        const key = 'notifications-read';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<{ message: string }>(path, { last_read_id: notificationId }, { key });
        this.emit('api:ReadNotification', {
            notificationId,
            message: response.message
        });
        return response;
    }
    async updateTradeOfferUrl(trade_url: string) {
        const path = '/api/v1/me';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        if (!trade_url) {
            throw new Error('Trade URL cannot be empty');
        }

        const response = await this.patch<{ message: string }>(path, { trade_url }, { key });
        this.emit('api:UpdateTradeOfferUrl', {
            trade_url,
            message: response.message
        });
        return response;
    }
    async verifySms(phone_number: string, token?: string) {
        const path = '/api/v1/me/verify-sms';
        const key = 'verify_sms';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<{ message: string }>(path, { phone_number, token }, { key });
        this.emit('api:VerifySms', response);
        return response;
    }
    private parseParams(params: IGetListingsParams = {}): Record<string, any> {
        const {
            limit = 40,
            stickers,
            keychains,
            ...rest
        } = params;

        const query: Record<string, any> = {
            ...rest,
            limit,
        };

        if (stickers) {
            query.stickers = JSON.stringify(stickers);
        }

        if (keychains) {
            query.keychains = JSON.stringify(keychains);
        }
        return query;
    }
    async getListings(params: IGetListingsParams = {}): Promise<ICsFloatListingsResponse> {
        const path = '/api/v1/listings';
        const key = 'listing';

        if (params.limit === 0) {
            params.limit = 40;
        }

        if (params.limit && (params?.limit < 1 || params?.limit > 50)) {
            console.warn('Limit must be between 1 and 50, defaulting to 40');
            params.limit = 40;
        }

        await this.rateLimiter.ensureAvailable(key);

        const query = this.parseParams(params);

        const response = await this.get<ICsFloatListingsResponse>(path, { params: query, key });
        this.cache.listings = this.cache.listings || {};
        for (const listing of response.data || []) {
            this.cache.listings[listing.id] = listing;
        }
        this.emit('api:UpdateListings', response.data);

        return response;
    }

    async getListingBuyOrders(listingId: number, limit: number = 10) {
        const path = `/api/v1/listings/${listingId}/buy-orders`;
        const key = 'buy_orders';

        if (limit === 0 || limit < 1 || limit > 25) {
            console.warn('Limit must be between 1 and 25, defaulting to 10');
            limit = 10; // Default value
        }
        await this.rateLimiter.ensureAvailable(key);

        const res = await this.get<IBuyOrder[]>(path, { refererUrl: 'https://csfloat.com/item/' + listingId, limit, key });
        this.emit('api:UpdateListingBuyOrders', {
            listingId,
            buyOrders: res
        });
        return res;
    }
    async getListingSales(listingId: number) {
        const path = `/api/v1/listings/${listingId}/sales`;
        const key = 'sales';

        await this.rateLimiter.ensureAvailable(key);

        const res = await this.get<ISalesItemsResponse>(path, { refererUrl: 'https://csfloat.com/item/' + listingId, key });
        this.emit('api:UpdateSalesItems', {
            listingId,
            salesItems: res
        });
        return res;
    }
    async getListingSimilar(listingId: number) {
        const path = `/api/v1/listings/${listingId}/similar`;
        const key = 'similar';

        await this.rateLimiter.ensureAvailable(key);

        const res = await this.get<ISimilarItemEntry[]>(path, { refererUrl: 'https://csfloat.com/item/' + listingId, key });
        this.emit('api:UpdateSimilarItems', {
            listingId,
            similarItems: res
        });
    }

    async getItemHistory(market_hash_name: number, paint_index: number) {
        const path = `/api/v1/history/${market_hash_name}/graph`;
        const key = 'history';

        await this.rateLimiter.ensureAvailable(key);

        const res = await this.get<IItemHistoryEntry[]>(path, { paint_index, key });
        this.cache.itemHistory = this.cache.itemHistory || {};
        this.cache.itemHistory[`${market_hash_name}-${paint_index}`] = res;
        this.emit('api:UpdateItemHistory', {
            market_hash_name,
            paint_index,
            history: res
        });
        return res;
    }

    async bitItem(listingId: number, max_price: number) {
        const path = `/api/v1/listings/${listingId}/bit`;
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);
        if (max_price < 0) {
            throw new Error('Max price must be a positive number');
        }
        const response = await this.post<IBitItemResponse>(path, { max_price }, { key });
        this.emit('api:BitItem', response);
        return response;
    }
    async getMobileStatus() {
        const path = '/api/v1/me/mobile/status';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const res = await this.get<any>(path, { key });
        const status = res.status === 'active';
        this.emit('api:UpdateMobileStatus', {
            status,
            message: res.message || 'Mobile status retrieved successfully'
        });
        return res;
    }

    async newTradeOffer(options: {
        given_asset_ids: string[];
        offer_id: string;
        received_asset_ids: string[];
    }) {
        const path = '/api/v1/trades/steam-status/new-offer';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);
        if (!options.given_asset_ids || !options.received_asset_ids) {
            throw new Error('Both given_asset_ids and received_asset_ids must be provided');
        }
        if (options.given_asset_ids.length === 0 || options.received_asset_ids.length === 0) {
            throw new Error('Both given_asset_ids and received_asset_ids must contain at least one item');
        }
        if (!options.offer_id) {
            throw new Error('Offer ID must be provided');
        }


        const result = await this.post<ITradeOffer>(path, options, { key });
        this.emit('api:NewTradeOffer', result);
        return result;
    }
    async updateTradeOffer(options: {
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
    }) {
        const path = '/api/v1/trades/steam-status/offer';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.post<ITradeOffer>(path, options, { key });
        this.emit('api:UpdateTradeOffer', response);
        return response;
    }
    async setMobileStatus(status: boolean) {
        const path = '/api/v1/me/mobile/status';
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);
        const response = await this.post<{ message: string }>(path, { version: '8.0.0' }, { key });
        this.emit('api:UpdateMobileStatus', {
            status,
            message: response.message
        });
        return response;
    }
    async changeListingPrice(listingId: string, newPrice: number) {
        const path = `/api/v1/listings/${listingId}`;
        const key = 'main';
        await this.rateLimiter.ensureAvailable(key);
        if (newPrice < 0) {
            throw new Error('New price must be a positive number');
        }
        const response = await this.patch<IListingEntry>(path, { price: newPrice }, { key });
        this.cache.listings = this.cache.listings || {};
        this.cache.listings[listingId] = response;
        return response;
    }
    async getListingById(listingId: number) {
        const path = `/api/v1/listings/${listingId}`;
        const key = 'main';

        await this.rateLimiter.ensureAvailable(key);

        const response = await this.get<IListingEntry>(path, { refererUrl: 'https://csfloat.com/item/' + listingId, key });

        this.cache.listings = this.cache.listings || {};
        this.cache.listings[listingId] = response;
        this.emit('api:UpdateListing', response);
        return response;
    }

    getRateLimit(key: string = 'main') {
        return this.rateLimiter.getInfo(key);
    }
    getRateLimits() {
        return this.rateLimiter.getAll();
    }
}
