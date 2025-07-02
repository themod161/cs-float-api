# cs-float-api

## Table of Contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [CsFloatClient](#csfloatclient)
  - [SchemaFetcher](#schemafetcher)
  - [Event Emitter](#event-emitter)
  - [Enums & Error Codes](#enums--error-codes)
  - [Expression Builder & Parser](#expression-builder--parser)
    - [BuyOrderExpressionBuilder](#buyorderexpressionbuilder)
    - [BuyOrderExpressionParser](#buyorderexpressionparser)
- [Schemas & Interfaces](#schemas--interfaces)
- [Available Types & Payloads](#available-types--payloads)
- [Event Payloads](#event-payloads)

---

*This README was generated with the assistance of ChatGPT.*

---

A lightweight, fully typed TypeScript library for working with the CSFloat service. Built on an event-driven model, it lets you subscribe to real-time updates and manage all aspects of your CS\:GO account and trade operations with zero boilerplate.

## Key Features

- 🎮 **Real-Time Data Updates**\
  Subscribe to strongly-typed events for profile changes, inventory updates, listings, offer history, notifications, and more—no polling required.

- 🔄 **Strictly Typed Events & Payloads**\
  Each API response (`UpdateMe`, `UpdateListings`, `UpdateInventory`, etc.) is exposed as a properly defined interface. Rate limits and errors are emitted as typed events.

- 🤝 **Comprehensive Trade Management**\
  Methods for creating, cancelling, and accepting trade offers; placing and updating buy orders; configuring auto-bidding, maximum bargaining, and stall visibility/away status.

- 📦 **Expression Builder & Parser**\
  Utility classes to construct buy-order expressions programmatically and parse existing expressions back into structured parameters.

- 🌐 **Universal Bundles**\
  Ships pre-built for CommonJS, ESM, and UMD so you can use it in Node.js scripts, modern bundlers, or directly in the browser.

- 📜 **Type Declarations & Sourcemaps**\
  Includes `.d.ts` files and source maps for seamless IDE autocomplete and easy debugging.

## Installation

```bash
npm install cs-float-api
```

## Quick Start

```ts
import { CsFloatClient } from 'cs-float-api';

// Initialize the client
const client = new CsFloatClient({
  apiKey: process.env.CS_FLOAT_KEY,
  //or
  session: process.env.CS_FLOAT_SESSION,
});

// Listen for profile updates
client.on('api:UpdateMe', (profile) => {
  console.log('Logged in as', profile.username);
});

// Fetch csfloat profile
await client.getMe().catch((res) => {
  console.log(`[Error] GetMe: ${res.message}`);
  return null;
});
```

---

Equip your bots, dashboards, and trading tools with a robust, event-driven interface to CSFloat—ditch manual HTTP calls and embrace full TypeScript safety!

## API Reference

### CsFloatClient

The `CsFloatClient` exposes methods to interact with the CSFloat API and emit events defined in `CsFloatClientEvents`.

```ts
new CsFloatClient(options: CsFloatApiKeyOptions | CsFloatSessionOptions)
```

| Method                                                                                                                      | Returns                         | Description                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `getMe(): Promise<ICsFloatMeResponse>`                                                                                      | `ICsFloatMeResponse`            | Fetch current user profile. Emits `api:UpdateMe`.                                 |
| `getListings(params?: IGetListingsParams): Promise<IListingEntry[]>`                                                        | `IListingEntry[]`               | Retrieve marketplace listings with optional filters. Emits `api:UpdateListings`.  |
| `getInventory(params?: IGetInventoryParams): Promise<IInventoryItem[]>`                                                     | `IInventoryItem[]`              | Get your Steam inventory items. Emits `api:UpdateInventory`.                      |
| `getNotifications(params?: IGetNotificationsParams): Promise<INotificationsResponse>`                                       | `INotificationsResponse`        | List your notifications. Emits `api:UpdateNotifications`.                         |
| `readNotification(notificationId: string): Promise<{ notificationId: string; message: string }>`                            | Object                          | Mark a notification as read. Emits `api:ReadNotification`.                        |
| `getOfferHistory(offerId: string, params?: IGetOfferHistoryParams): Promise<{ offerId: string; history: IOfferHistory[] }>` | Object                          | Get history entries for a specific trade offer. Emits `api:UpdateOfferHistory`.   |
| `getOffersTimeline(params?: IGetOffersTimelineParams): Promise<IOffersResponse>`                                            | `IOffersResponse`               | Fetch your outgoing/incoming offer timeline. Emits `api:UpdateOffersTimeline`.    |
| `getStall(): Promise<IListingEntry[]>`                                                                                      | `IListingEntry[]`               | Get your current stall/listings. Emits `api:UpdateStall`.                         |
| `getSaleItem(listingId: string): Promise<ISaleItemParams>`                                                                  | `ISaleItemParams`               | Fetch details for a sale item. Emits `api:UpdateSaleItem`.                        |
| `placeBuyOrder(body: IPlaceBuyOrderBody): Promise<IBuyOrder>`                                                               | `IBuyOrder`                     | Place a new buy order by expression or market name. Emits `api:BuyItems`.         |
| `deleteBuyOrder(orderId: string): Promise<{ message: string }>`                                                             | Object                          | Cancel an existing buy order. Emits `api:CancelTrades`.                           |
| `updateBuyOrder(buyOrder: IBuyOrder, options?: { max_price?: number; quantity?: number }): Promise<IBuyOrder>`              | `IBuyOrder`                     | Modify an existing buy order. Emits `api:BuyItems`.                               |
| `getBuyOrders(): Promise<IBuyOrder[]>`                                                                                      | `IBuyOrder[]`                   | List all active buy orders. Emits `api:UpdateBuyOrders`.                          |
| `setAutoBits(enable: boolean): Promise<IAutoBitsResponse>`                                                                  | `IAutoBitsResponse`             | Enable or disable automatic bit bidding. Emits `api:UpdateAutoBits`.              |
| `setMaxBargain(maxBargain: number): Promise<{ maxBargain: number; message: string }>`                                       | Object                          | Configure maximum bargaining delta. Emits `api:UpdateMaxBargain`.                 |
| `setBargainStatus(enable: boolean): Promise<{ status: boolean; message: string }>`                                          | Object                          | Turn auto-bargaining on/off. Emits `api:UpdateBargainStatus`.                     |
| `setPrivacyStall(isPublic: boolean): Promise<{ isPublic: boolean; message: string }>`                                       | Object                          | Toggle your stall visibility (public/private). Emits `api:UpdatePrivacyStall`.    |
| `setAwayStall(isAway: boolean): Promise<{ isAway: boolean; message: string }>`                                              | Object                          | Toggle "away" status on your stall. Emits `api:UpdateAwayStall`.                  |
| `setTradeOfferUrl(trade_url: string): Promise<{ trade_url: string; message: string }>`                                      | Object                          | Update your Steam trade offer URL. Emits `api:UpdateTradeOfferUrl`.               |
| `verifySms(phone_number: string, token?: string): Promise<{ message: string }>`                                             | Object                          | Send/verify SMS for two-factor. Emits `api:verifySms`.                            |
| `changeListingPrice(listingId: string, newPrice: number): Promise<IListingEntry>`                                           | `IListingEntry`                 | Update price of one of your listings.                                             |
| `getListingById(listingId: number): Promise<IListingEntry>`                                                                 | `IListingEntry`                 | Fetch a specific listing by ID. Emits `api:UpdateListing`.                        |
| `getRateLimit(key?: string): RateLimitInfo`                                                                                 | `RateLimitInfo`                 | Get rate limit info for a single key. Emits `rateLimit:Update` during operations. |
| `getRateLimits(): Record<string, RateLimitInfo>`                                                                            | `Record<string, RateLimitInfo>` | Retrieve all tracked rate limits.                                                 |

### SchemaFetcher

Static methods to load and query the CSFloat API schema information (item definitions, rarities, collections):

```ts
import { SchemaFetcher } from 'cs-float-api';
```

| Method                                                                             | Returns                   | Description                                                                            |                                                |
| ---------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `SchemaFetcher.load(): Promise<void>`                                              | void                      | Download and cache the entire schema from CSFloat.                                     |                                                |
| `SchemaFetcher.getItem(key: string): Promise<ISchemaItem                         \| null>`                   | `ISchemaItem \| null`                                                                  | Find a specific schema item by its unique key. |
| `SchemaFetcher.getItemByName(name: string): Promise<ISchemaItem                  \| null>`                   | `ISchemaItem \| null`                                                                  | Look up an item by its display name.           |
| `SchemaFetcher.getCollections(): Promise<ISchemaCollectionItem[]>`                 | `ISchemaCollectionItem[]` | List all schema collections (e.g., cases, sticker capsules).                           |                                                |
| `SchemaFetcher.getCollectionsByName(name: string): Promise<ISchemaCollectionItem \| null>`                   | `ISchemaCollectionItem \| null`                                                        | Find a single collection by its name.          |
| `SchemaFetcher.getRarities(): Promise<ISchemaRarityItem[]>`                        | `ISchemaRarityItem[]`     | Get all item rarity definitions (e.g., Classified, Covert).                            |                                                |
| `SchemaFetcher.getQualityVariants(key: string): Promise<IMarketHashVariant[]>`     | `IMarketHashVariant[]`    | Return all market-hash-name variants (qualities, StatTrak/Souvenir flags) for an item. |                                                |

### Event Emitter

All server-sent updates are emitted through the standard `EventEmitter` API:

```ts
client.on('api:UpdateInventory', (items) => console.log(items.length));
client.emit('api:UpdateBuyOrders', buyOrdersArray);
```

### Enums & Error Codes

Import `CsFloatTransactionType` and `Rarity` from the library to work with constant sets, and check `CSFloatErrorCodes` for API error messages.

### Expression Builder & Parser

CS-Float uses a custom expression syntax for buy orders. The library provides `BuyOrderExpressionBuilder` and `BuyOrderExpressionParser` to work with these expressions.

### BuyOrderExpressionBuilder

**Constructor**

```ts
new BuyOrderExpressionBuilder(initialExpression?: string)
```

- **initialExpression**: Optional raw expression string to parse as the starting AST.

**Instance Methods**

- `addRule(field, operator, value): this`\
  Add a comparison rule.

  - **field**: one of `BuyOrderField` (e.g., `'FloatValue'`, `'DefIndex'`, `'Rarity'`, etc.)
  - **operator**: field-specific operator (e.g., `'=='`, `'>='`, `'has'`)
  - **value**: constant of the correct type (number, boolean, or string)

- `addStickerRule(stickerId, options): this`\
  Add a sticker requirement.

  - **stickerId**: numeric sticker identifier
  - **options**: exactly one of `{ qty: number }` or `{ slot: number }`

- `addGroup(condition, callback): this`\
  Nest a group of rules under an `'and'` or `'or'` condition.

  - **condition**: `'and' | 'or'`
  - **callback**: receives a fresh `BuyOrderExpressionBuilder` to define sub-rules

- `buildExpression(): IExpressionGroup`\
  Returns the internal AST representing all added rules and groups.

- `getExpression(): IExpressionGroup`\
  Alias for `buildExpression()`.

- `buildBuyOrder(max_price, quantity): IPlaceBuyOrderBody`\
  Create the final request payload:

  - Validates that required fields (`DefIndex` and `PaintIndex`) are present.
  - Returns `{ expression: IExpressionGroup; max_price; quantity }`.

**Static Methods**

- `BuyOrderExpressionBuilder.parse(raw: string): IExpressionGroup`\
  Parse a raw expression into an AST, throwing on invalid syntax.

- `BuyOrderExpressionBuilder.parseRarity(value: string): Rarity`\
  Convert a rarity name (e.g., `'Classified'`) into the `Rarity` enum value.

### BuyOrderExpressionParser

An alias for `BuyOrderExpressionBuilder.parse`:

```ts
const ast = BuyOrderExpressionParser.parse(rawExpression);
```

## Schemas & Interfaces

Below are the core schema and interface definitions provided by the library. Import and reference these to work with raw API responses, request parameters, and AST types.

```ts
// Authentication & Client Options
type CsFloatApiKeyOptions = { apiKey: string; endpoint?: string };
type CsFloatSessionOptions = { sessionToken: string; endpoint?: string };

// User Profile
type ICsFloatMeResponse = {
  id: string;
  username: string;
  steamId: string;
  avatarUrl: string;
  balance: number;
  currency: string;
  tradeUrl?: string;
};

// Listings & Inventory
type IListingEntry = {
  listingId: number;
  item: ISchemaItem;
  price: number;
  currency: string;
  quantity: number;
  createdAt: string;
};
type ICsFloatListingsResponse = {
  listings: IListingEntry[];
  total: number;
  page: number;
  pageSize: number;
};
type IInventoryItem = {
  assetId: string;
  marketHashName: string;
  schemaItem: ISchemaItem;
  floatValue?: number;
  paintIndex?: number;
  stickers?: Array<{ stickerId: number; slot: number }>;
};

// Notifications & Offers
type INotificationsResponse = { notifications: Array<{ id: string; message: string; createdAt: string }> };
type IOfferHistory = { timestamp: string; status: string; details?: string };
type IOffersResponse = { offers: ITradeOffer[]; count: number };
type ITradeOffer = {
  offerId: string;
  itemsToGive: IInventoryItem[];
  itemsToReceive: IInventoryItem[];
  status: string;
  createdAt: string;
};
type ITradeOfferResponse = { offers: ITradeOffer[] };

// Buy Orders
type IPlaceBuyOrderBody = { expression: IExpressionGroup; max_price: number; quantity: number };
type IBuyOrder = {
  orderId: string;
  expression: IExpressionGroup;
  maxPrice: number;
  quantity: number;
  filled: number;
  createdAt: string;
};

type IAutoBitsResponse = { enabled: boolean; message: string };
type ICsFloatAccountStandingResponse = { score: number; level: number; status: string };

// Schema Definitions
interface ISchemaItem {
  defIndex: number;
  name: string;
  type: string;
  rarity: Rarity;
  exterior: string;
  marketable: boolean;
}
interface ISchemaCollectionItem { name: string; items: number[]; }
interface ISchemaRarityItem { name: string; value: Rarity }
interface IMarketHashVariant { paintIndex: number; quality: string; statTrak: boolean; souvenir: boolean }

// Request Parameter Interfaces
type IGetListingsParams = { page?: number; pageSize?: number; sortBy?: string };
type IGetInventoryParams = { steamId?: string; tradableOnly?: boolean };
type IGetNotificationsParams = { unreadOnly?: boolean; limit?: number };
type IGetOfferHistoryParams = { limit?: number };
type IGetOffersTimelineParams = { direction?: 'in' | 'out'; limit?: number };

// Expression AST Interfaces
interface IExpressionRule {
  field: BuyOrderField;
  operator: string;
  value: string | number | boolean;
}
interface IExpressionGroup {
  condition: 'and' | 'or';
  rules: Array<IExpressionRule | IExpressionGroup>;
}

// Enums & Constants
enum Rarity { Common = 1, Uncommon, Rare, Mythical, Legendary, Ancient, Extraordinary }
enum BuyOrderField { DefIndex = 'DefIndex', FloatValue = 'FloatValue', Rarity = 'Rarity', PaintIndex = 'PaintIndex' }
```

## Available Types & Payloads

Import these interfaces to use the correct types for event handlers and API responses.

```ts
import {
  ICsFloatMeResponse,
  ICsFloatListingsResponse,
  IInventoryItem,
  INotificationsResponse,
  IOfferHistory,
  IOffersResponse,
  IListingEntry,
  ISaleItemParams,
  IBuyOrder,
  ITradeOffer,
  IAutoBitsResponse,
  ICsFloatAccountStandingResponse,
  ITradeOfferResponse
} from 'cs-float-api';
```

### Event Payloads

| Event Name                  | Payload Type                                                               | Description                               |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| `api:UpdateMe`              | `ICsFloatMeResponse`                                                       | User profile data                         |
| `api:UpdateListings`        | `ICsFloatListingsResponse`                                                 | Updated marketplace listings              |
| `api:UpdateInventory`       | `IInventoryItem[]`                                                         | Current inventory items                   |
| `api:UpdateTradeOfferUrl`   | `{ trade_url: string; message: string }`                                   | Trade offer URL                           |
| `api:ReadNotification`      | `{ notificationId: string; message: string }`                              | Notification marked as read               |
| `api:UpdateNotifications`   | `INotificationsResponse`                                                   | Full list of notifications                |
| `api:UpdateOfferHistory`    | `{ offerId: string; history: IOfferHistory[] }`                            | History of a specific trade offer         |
| `api:UpdateOffersTimeline`  | `IOffersResponse`                                                          | Timeline of offers                        |
| `api:UpdateStall`           | `IListingEntry[]`                                                          | User stall/listing entries                |
| `api:UpdateSaleItem`        | `ISaleItemParams`                                                          | Parameters for a sale item                |
| `api:BuyItems`              | `IBuyOrder[]`                                                              | Results of placing or updating buy orders |
| `api:CancelTrades`          | `ITradeOffer[]`                                                            | Cancelled trade offers                    |
| `api:AcceptTrades`          | `ITradeOffer[]`                                                            | Accepted trade offers                     |
| `api:UpdateAutoBits`        | `IAutoBitsResponse`                                                        | Auto-bidding status                       |
| `api:UpdateMaxBargain`      | `{ maxBargain: number; message: string }`                                  | Maximum bargaining allowance              |
| `api:UpdateBargainStatus`   | `{ status: boolean; message: string }`                                     | Auto-bargain on/off status                |
| `api:UpdatePrivacyStall`    | `{ isPublic: boolean; message: string }`                                   | Toggle stall visibility                   |
| `api:UpdateAwayStall`       | `{ isAway: boolean; message: string }`                                     | Toggle away status on stall               |
| `api:UpdateBuyOrders`       | `IBuyOrder[]`                                                              | Updated list of buy orders                |
| `api:UpdateAccountStanding` | `ICsFloatAccountStandingResponse`                                          | Account rating and standing               |
| `api:UpdateTrades`          | `ITradeOfferResponse`                                                      | Current trade offer responses             |
| `api:UpdateBuyOrderDetails` | `IBuyOrder`                                                                | Details of a single buy order             |
| `api:UpdateMeEvery`         | `ICsFloatMeResponse`                                                       | Periodic profile update                   |
| `rateLimit:Update`          | `(key: string, info: { limit: number; remaining: number; reset: number })` | Rate limit information                    |
| `error`                     | `Error`                                                                    | Any client error                          |
| `api:verifySms`             | `{ message: string }`                                                      | SMS verification message                  |

---

For more details, explore the source code.

---

*This README was generated with the assistance of ChatGPT.*