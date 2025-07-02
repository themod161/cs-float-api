"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CsFloatClient: () => CsFloatClient
});
module.exports = __toCommonJS(index_exports);

// src/CsFloatClient.ts
var import_axios = __toESM(require("axios"));

// src/types.ts
var RarityNameMap = {
  consumer: 0 /* Consumer */,
  industrial: 1 /* Industrial */,
  "mil-spec": 2 /* MilSpec */,
  restricted: 3 /* Restricted */,
  classified: 4 /* Classified */,
  covert: 5 /* Covert */,
  contraband: 6 /* Contraband */
};
var HttpStatusMessages = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout"
};

// src/rateLimit.ts
var import_events = require("events");
var RateLimiter = class _RateLimiter extends import_events.EventEmitter {
  constructor() {
    super(...arguments);
    this.limits = /* @__PURE__ */ new Map();
  }
  update(headers, key = "main") {
    var _a, _b, _c;
    const limit = parseInt((_a = headers["x-ratelimit-limit"]) != null ? _a : "0");
    const remaining = parseInt((_b = headers["x-ratelimit-remaining"]) != null ? _b : "1");
    const reset = parseInt((_c = headers["x-ratelimit-reset"]) != null ? _c : `${Math.floor(Date.now() / 1e3)}`);
    if (!isNaN(limit)) {
      this.limits.set(key, { limit, remaining, reset });
    }
    this.emit("rateLimit:Update", key, { limit, remaining, reset });
  }
  on(eventName, listener) {
    super.on(eventName, listener);
    return this;
  }
  async ensureAvailable(key = "main") {
    const info = this.limits.get(key);
    if (!info) return;
    const { remaining, reset } = info;
    if (remaining <= 0) {
      const now = Math.floor(Date.now() / 1e3);
      const wait = reset - now;
      if (wait > 0) {
        console.warn(`[RateLimit] [${key}] waiting ${wait}s`);
        await new Promise((resolve) => setTimeout(resolve, wait * 1e3));
      }
    }
  }
  getInfo(key = "main") {
    return this.limits.get(key);
  }
  getAll() {
    const now = Math.floor(Date.now() / 1e3);
    const limits = Array.from(this.limits.entries()).map(([key, value]) => ({
      key,
      ...value,
      reset_in: Math.max(0, (value.reset - now) * 1e3),
      reset_in_string: _RateLimiter.formatDuration(value.reset - now)
    }));
    return {
      limits,
      keys: Array.from(this.limits.keys())
    };
  }
  getKeys() {
    return [...this.limits.keys()];
  }
  static formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return `resets in ${parts.join(" ")}`;
  }
};

// src/BuyOrderExpressionBuilder.ts
var FieldMetaMap = {
  FloatValue: { operators: ["==", ">", ">=", "<", "<="], valueType: "number" },
  Stickers: { operators: ["has"], valueType: "object" },
  PaintSeed: { operators: ["==", ">", ">=", "<", "<="], valueType: "number" },
  StatTrak: { operators: ["=="], valueType: "boolean", allowedValues: [true, false] },
  Souvenir: { operators: ["=="], valueType: "boolean", allowedValues: [true, false] },
  Rarity: { operators: ["=="], valueType: "number" },
  DefIndex: { operators: ["=="], valueType: "number" },
  PaintIndex: { operators: ["=="], valueType: "number" }
};
var BuyOrderExpressionBuilder = class _BuyOrderExpressionBuilder {
  constructor(stringInput) {
    this.root = { condition: "and", rules: [] };
    if (stringInput) {
      this.root = _BuyOrderExpressionBuilder.parse(stringInput);
    }
  }
  getExpression() {
    return this.root;
  }
  static parse(input) {
    if (!input || typeof input !== "string") {
      throw new Error("\u274C Input must be a non-empty string");
    }
    if (!input.includes("=")) {
      throw new Error("Don't provide here an market hash name, use 'getWeaponByMarketHashName' method instead");
    }
    const builder = new _BuyOrderExpressionBuilder();
    const expression = this._parseExpression(input);
    return expression;
  }
  static _wrapIfNeeded(group) {
    const isSingleRule = group.rules.length === 1 && "field" in group.rules[0];
    return isSingleRule ? group.rules[0] : { expression: group };
  }
  static _parseExpression(input) {
    if (input.startsWith("(") && input.endsWith(")")) {
      input = input.slice(1, -1);
    }
    const andParts = this._splitByTopLevel(input, "and");
    if (andParts.length > 1) {
      return {
        condition: "and",
        rules: andParts.map((part) => {
          const parsed = this._parseExpression(part.trim());
          return this._wrapIfNeeded(parsed);
        })
      };
    }
    const orParts = this._splitByTopLevel(input, "or");
    if (orParts.length > 1) {
      return {
        condition: "or",
        rules: orParts.map((part) => {
          const parsed = this._parseExpression(part.trim());
          return this._wrapIfNeeded(parsed);
        })
      };
    }
    const stickerMatch = input.match(/HasSticker\((\d+),\s*(-?\d+),\s*(\d+)\)/);
    if (stickerMatch) {
      const [, idStr, slotStr, qtyStr] = stickerMatch;
      const id = Number(idStr);
      const qty = Number(qtyStr);
      const slot = Number(slotStr);
      return {
        condition: "and",
        rules: [{
          field: "Stickers",
          operator: "has",
          value: {
            sticker: { id, qty, slot }
          }
        }]
      };
    }
    const opMatch = input.match(/(DefIndex|PaintIndex|FloatValue|StatTrak|Souvenir|Rarity|PaintSeed)\s*(==|>=|<=|<|>)\s*(.+)/);
    if (opMatch) {
      const [, field, operator, rawValue] = opMatch;
      let value = rawValue.trim();
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (!isNaN(Number(value))) value = Number(value);
      return {
        condition: "and",
        rules: [{
          field,
          operator,
          value: { constant: String(value) }
        }]
      };
    }
    throw new Error(`\u274C \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C \u0432\u044B\u0440\u0430\u0436\u0435\u043D\u0438\u0435: ${input}`);
  }
  static _splitByTopLevel(input, separator) {
    const parts = [];
    let depth = 0;
    let current = "";
    const tokens = input.split(/(\s+|\(|\))/).filter(Boolean);
    for (const token of tokens) {
      if (token === "(") depth++;
      if (token === ")") depth--;
      if (depth === 0 && token.trim() === separator) {
        parts.push(current.trim());
        current = "";
      } else {
        current += token;
      }
    }
    if (current) parts.push(current.trim());
    return parts;
  }
  addRule(field, operator, value) {
    this.validateOperator(field, operator);
    this.validateValue(field, value);
    this.root.rules.push({
      field,
      operator,
      value: { constant: String(value) }
    });
    return this;
  }
  addStickerRule(stickerId, options) {
    const { qty, slot } = options;
    if (qty === void 0 && slot === void 0 || qty !== void 0 && slot !== void 0) {
      throw new Error("\u274C Sticker rule must have either 'qty' or 'slot', but not both");
    }
    this.root.rules.push({
      field: "Stickers",
      operator: "has",
      value: {
        sticker: {
          id: stickerId,
          ...qty !== void 0 ? { qty } : {},
          ...slot !== void 0 ? { slot } : {}
        }
      }
    });
    return this;
  }
  addGroup(condition, callback) {
    const subBuilder = new _BuyOrderExpressionBuilder();
    callback(subBuilder);
    this.root.rules.push({
      expression: {
        condition,
        rules: subBuilder.root.rules
      }
    });
    return this;
  }
  buildExpression() {
    return this.root;
  }
  buildBuyOrder(max_price, quantity) {
    if (typeof quantity !== "number" || quantity <= 0) {
      throw new Error("\u274C 'quantity' must be a positive number");
    }
    this.ensureRequiredFields(["DefIndex", "PaintIndex"]);
    return {
      expression: this.root,
      max_price,
      quantity
    };
  }
  static parseRarity(value) {
    const normalized = value.trim().toLowerCase();
    if (!(normalized in RarityNameMap)) {
      throw new Error(`\u274C Unknown rarity name: '${value}'`);
    }
    return RarityNameMap[normalized];
  }
  validateOperator(field, operator) {
    const allowedOperators = FieldMetaMap[field].operators;
    const operators = [...allowedOperators];
    if (!operators.includes(operator)) {
      throw new Error(`\u274C Operator '${operator}' not allowed for '${field}'. Allowed: ${operators.join(", ")}`);
    }
  }
  validateValue(field, value) {
    const meta = FieldMetaMap[field];
    const actualType = typeof value;
    if (meta.valueType !== "object" && actualType !== meta.valueType) {
      throw new Error(`\u274C Invalid value type for '${field}'. Expected ${meta.valueType}, got ${actualType}`);
    }
    if ("allowedValues" in meta && Array.isArray(meta.allowedValues)) {
      if (!meta.allowedValues.includes(value)) {
        throw new Error(`\u274C Invalid value for '${field}'. Allowed values: ${meta.allowedValues.join(", ")}`);
      }
    }
  }
  ensureRequiredFields(requiredFields) {
    const flatRules = this.flattenRules(this.root);
    for (const field of requiredFields) {
      if (!flatRules.some((rule) => "field" in rule && rule.field === field)) {
        throw new Error(`\u274C Missing required field '${field}' in expression.`);
      }
    }
  }
  flattenRules(group) {
    const result = [];
    for (const rule of group.rules) {
      if ("field" in rule) {
        result.push(rule);
      } else if ("expression" in rule) {
        result.push(...this.flattenRules(rule.expression));
      }
    }
    return result;
  }
};

// src/CsFloatClient.ts
var import_qs = __toESM(require("qs"));
var import_events2 = require("events");
var CsFloatClient = class extends import_events2.EventEmitter {
  constructor(options) {
    var _a, _b;
    super();
    this.options = options;
    this.rateLimiter = new RateLimiter();
    this.user = null;
    this.updateInterval = null;
    this.updateMeEvery = null;
    this.cache = {
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
    this.client = import_axios.default.create({
      baseURL: (_a = options.baseUrl) != null ? _a : "https://csfloat.com",
      headers: "apiKey" in options ? { Authorization: `${options.apiKey}` } : { Cookie: `session=${options.session}` }
    });
    this.updateMeEvery = (_b = options.updateUserEvery) != null ? _b : null;
  }
  emit(eventName, ...args) {
    return super.emit(eventName, ...args);
  }
  on(event, listener) {
    if (event === "api:UpdateMe" && this.listenerCount(event) === 0) {
      if (!this.updateMeEvery) {
        this.updateMeEvery = 6e4;
      }
      this.startUpdateMeInterval();
    }
    if (event === "rateLimit:Update") {
      this.rateLimiter.on("update", (key, info) => {
        this.emit("rateLimit:Update", key, info);
      });
    }
    super.on(event, listener);
    return this;
  }
  off(event, listener) {
    super.off(event, listener);
    if (event === "api:UpdateMe" && this.listenerCount(event) === 0) {
      this.stopUpdateMeInterval();
    }
    return this;
  }
  startUpdateMeInterval() {
    if (this.updateInterval) return;
    const fetchMe = async () => {
      const me = await this.getMe().catch((error) => {
        this.emit("error", error);
        return null;
      });
    };
    fetchMe();
    this.updateInterval = setInterval(() => {
      fetchMe();
    }, this.updateMeEvery || 6e4);
  }
  stopUpdateMeInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  async get(path, params) {
    try {
      const { refererUrl, key, ...query } = params || {};
      const headers = {};
      if (refererUrl) {
        headers.referer = refererUrl;
      }
      const response = await this.client.get(path, {
        params: query,
        headers,
        paramsSerializer: {
          serialize: (params2) => {
            const modified = { ...params2 };
            if (Array.isArray(modified.state)) {
              modified.state = modified.state.join(",");
            }
            return import_qs.default.stringify(modified, { encode: true });
          }
        }
      });
      this.rateLimiter.update(response.headers, key || "main");
      return response.data;
    } catch (error) {
      if (import_axios.default.isAxiosError(error) && error.response) {
        throw error.response.data || new Error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
      } else {
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    }
  }
  async post(path, data, options = { key: "main" }) {
    try {
      const response = await this.client.post(path, data, options);
      this.rateLimiter.update(response.headers, options.key);
      return response.data;
    } catch (error) {
      if (import_axios.default.isAxiosError(error) && error.response) {
        throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] };
      } else {
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    }
  }
  async put(path, data, options = { key: "main" }) {
    try {
      const response = await this.client.put(path, data, options);
      this.rateLimiter.update(response.headers, options.key);
      return response.data;
    } catch (error) {
      if (import_axios.default.isAxiosError(error) && error.response) {
        throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] };
      } else {
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    }
  }
  async patch(path, data, options = { key: "main" }) {
    try {
      const response = await this.client.patch(path, data, options);
      this.rateLimiter.update(response.headers, options.key);
      return response.data;
    } catch (error) {
      if (import_axios.default.isAxiosError(error) && error.response) {
        throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] };
      } else {
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    }
  }
  async delete(path, options = { key: "main" }) {
    try {
      const response = await this.client.delete(path, options);
      this.rateLimiter.update(response.headers, options.key);
      return response.data;
    } catch (error) {
      if (import_axios.default.isAxiosError(error) && error.response) {
        throw error.response.data || { code: error.response.status, message: HttpStatusMessages[error.response.status] };
      } else {
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    }
  }
  async getAccountStanding() {
    const path = "/api/v1/account-standing";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, {
      key
    });
    this.cache.accountStanding = response;
    this.emit("api:UpdateAccountStanding", response);
    return response;
  }
  async getBuyOrders(page = 0, limit = 10, order = "desc") {
    const path = `/api/v1/me/buy-orders`;
    const key = "main";
    if (page < 0 || limit < 1) {
      console.warn("Page must be >= 0 and limit must be >= 1, defaulting to page 0 and limit 10");
      page = 0;
      limit = 10;
    }
    if (limit > 100) {
      console.warn("Limit must be <= 100, defaulting to 10");
      limit = 10;
    }
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", page, limit, order, key });
    this.cache.buyOrders = response.orders;
    this.emit("api:UpdateBuyOrders", response.orders);
    return response;
  }
  async updateBuyOrderDetails(buyOrder, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!buyOrder.id) {
      throw new Error("Buy order ID is required");
    }
    const useMarketHash = (_b = (_a = options.market_hash_name) != null ? _a : !options.expression && buyOrder.market_hash_name !== void 0) != null ? _b : false;
    const newBuyOrderData = {
      expression: useMarketHash ? void 0 : (_c = options.expression) != null ? _c : new BuyOrderExpressionBuilder(buyOrder.expression).buildExpression(),
      market_hash_name: useMarketHash ? (_d = options.market_hash_name) != null ? _d : buyOrder.market_hash_name : void 0,
      max_price: (_e = options.max_price) != null ? _e : buyOrder.price,
      quantity: (_f = options.quantity) != null ? _f : buyOrder.qty
    };
    if (newBuyOrderData.max_price < 0) {
      throw new Error("Max price must be a positive number");
    }
    if (newBuyOrderData.quantity < 0) {
      throw new Error("Quantity must be a positive number");
    }
    if (!newBuyOrderData.expression && !newBuyOrderData.market_hash_name) {
      throw new Error("Either expression or market_hash_name must be provided");
    }
    if (newBuyOrderData.expression && newBuyOrderData.market_hash_name) {
      throw new Error("Cannot provide both expression and market_hash_name");
    }
    if (newBuyOrderData.expression && typeof newBuyOrderData.expression !== "object") {
      throw new Error("Expression must be an object");
    }
    if (!newBuyOrderData.market_hash_name) delete newBuyOrderData.market_hash_name;
    if (!newBuyOrderData.expression) delete newBuyOrderData.expression;
    const order = await this.deleteBuyOrder(buyOrder.id);
    if (order.message !== "successfully removed the order") {
      throw new Error(`Failed to delete buy order: ${order.message}`);
    }
    this.cache.buyOrders = ((_g = this.cache.buyOrders) == null ? void 0 : _g.filter((o) => o.id !== buyOrder.id)) || [];
    const response = await this.placeBuyOrder(newBuyOrderData);
    if (!response || !("id" in response)) {
      throw new Error("Failed to place new buy order");
    }
    this.cache.buyOrders = this.cache.buyOrders || [];
    this.cache.buyOrders.push(response);
    this.emit("api:UpdateBuyOrders", this.cache.buyOrders);
    return response;
  }
  async deleteBuyOrder(orderId) {
    var _a;
    const path = `/api/v1/buy-orders/${orderId}`;
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.delete(path, {
      key
    });
    if (response.message !== "successfully removed the order") {
      throw new Error(`Failed to delete buy order: ${response.message}`);
    }
    this.cache.buyOrders = ((_a = this.cache.buyOrders) == null ? void 0 : _a.filter((o) => o.id !== orderId)) || [];
    this.emit("api:UpdateBuyOrders", this.cache.buyOrders);
    return response;
  }
  async getMe() {
    const path = "/api/v1/me";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", key });
    this.user = response;
    this.cache.me = response;
    this.emit("api:UpdateMe", response);
    return response;
  }
  async placeBuyOrder(options) {
    const path = `/api/v1/buy-orders`;
    const key = "buy_order";
    await this.rateLimiter.ensureAvailable(key);
    const request = {
      max_price: options.max_price,
      quantity: options.quantity
    };
    if ("expression" in options) {
      request.expression = options.expression;
    } else {
      request.market_hash_name = options.market_hash_name;
    }
    const response = await this.post(path, request, {
      key
    });
    this.cache.buyOrders = this.cache.buyOrders || [];
    this.cache.buyOrders.push(response);
    this.emit("api:UpdateBuyOrders", this.cache.buyOrders);
    return response;
  }
  async getAutoBits() {
    const path = "/api/v1/me/auto-bids";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", key });
    this.cache.autoBits = response;
    this.emit("api:UpdateAutoBits", response);
    return response;
  }
  /**
      * Changes the maximum allowed bargain value.
      * 
      * @param number - The new max bargain value (percent). Must be a positive number.
      * @throws Will throw an error if the value is less than 0.
  */
  async changeMaxBargain(number) {
    const path = "/api/v1/me";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    if (number < 0) {
      throw new Error("Max bargain must be a positive number");
    }
    if (number > 90) {
      throw new Error("Max bargain cannot be more than 90 percent");
    }
    const response = await this.patch(path, { max_offer_discount: number * 100 }, { key });
    this.emit("api:UpdateMaxBargain", {
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
  async setBargainStatus(status) {
    const path = "/api/v1/me";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.patch(path, { offers_enabled: status }, { key });
    this.emit("api:UpdateBargainStatus", {
      status,
      message: response.message
    });
    return response;
  }
  async setPrivacyStall(isPublic) {
    const path = "/api/v1/me";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.patch(path, { stall_public: isPublic }, { key });
    this.emit("api:UpdatePrivacyStall", {
      isPublic,
      message: response.message
    });
    return response;
  }
  async setAwayStall(isAway) {
    const path = "/api/v1/me";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.patch(path, { away: isAway }, { key });
    this.emit("api:UpdateAwayStall", {
      isAway,
      message: response.message
    });
    return response;
  }
  async getTrades(options = {}) {
    const path = `/api/v1/me/trades`;
    const key = "trades";
    if (options.state && new Set(options.state).size !== options.state.length) {
      throw new Error("Duplicate values in 'state' parameter");
    }
    if (options.page === void 0) {
      options.page = 0;
    }
    if (options.limit === void 0) {
      options.limit = 30;
    }
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", ...options, key });
    this.cache.trades = response;
    this.emit("api:UpdateTrades", response);
    return response;
  }
  async acceptTrades(trade_ids) {
    const path = `/api/v1/trades/bulk/accept`;
    const key = "trades";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, { trade_ids }, { key });
    this.emit("api:AcceptTrades", response.data);
    return response;
  }
  async cancelTrades(trade_ids) {
    const path = `/api/v1/me/trades/bulk/cancel`;
    const key = "trades";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, { trade_ids }, { key });
    this.emit("api:CancelTrades", response.data);
    return response;
  }
  async buyItems(contract_ids, total_price) {
    const path = "/api/v1/listings/buy";
    const key = "buy_items";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, { contract_ids, total_price }, { key });
    this.emit("api:BuyItems", response);
    return response;
  }
  async sellItem(data) {
    const path = "/api/v1/listings/sell";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, data, { key });
    this.emit("api:UpdateSaleItem", response);
    return response;
  }
  async getInventory() {
    const path = "/api/v1/me/inventory";
    const key = "inventory";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", key });
    this.cache.inventory = response;
    this.emit("api:UpdateInventory", response);
    return response;
  }
  async getStore(userId, params = {}) {
    return this.getStall(userId, params);
  }
  async getStall(userId, params = {}) {
    const path = `/api/v1/users/${userId}/stall`;
    const key = "stall";
    if (params.limit === 0) {
      params.limit = 40;
    }
    if (params.limit && ((params == null ? void 0 : params.limit) < 1 || (params == null ? void 0 : params.limit) > 50)) {
      console.warn("Limit must be between 1 and 50, defaulting to 40");
      params.limit = 40;
    }
    await this.rateLimiter.ensureAvailable(key);
    const query = this.parseParams(params);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", params: query, key });
    this.emit("api:UpdateStall", response);
    return response;
  }
  async getOffersTimeLine(limit = 40) {
    const path = "/api/v1/me/offers-timeline";
    const key = "main";
    if (limit === 0) {
      limit = 40;
    }
    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }
    if (limit % 1 !== 0) {
      throw new Error("Limit must be an integer");
    }
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", limit, key });
    this.emit("api:UpdateOffersTimeline", response);
    return response;
  }
  async getOfferHistory(offerId) {
    const path = `/api/v1/offers/${offerId}/history`;
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", key });
    this.emit("api:UpdateOfferHistory", {
      offerId,
      history: response
    });
    return response;
  }
  async getNotifications() {
    const path = "/api/v1/me/notifications/timeline";
    const key = "notifications";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/profile", key });
    this.cache.notifications = response;
    this.emit("api:UpdateNotifications", response);
    return response;
  }
  async readNotification(notificationId) {
    const path = `/api/v1/me/notifications/read-receipt`;
    const key = "notifications-read";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, { last_read_id: notificationId }, { key });
    this.emit("api:ReadNotification", {
      notificationId,
      message: response.message
    });
    return response;
  }
  async updateTradeOfferUrl(trade_url) {
    const path = "/api/v1/me";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    if (!trade_url) {
      throw new Error("Trade URL cannot be empty");
    }
    const response = await this.patch(path, { trade_url }, { key });
    this.emit("api:UpdateTradeOfferUrl", {
      trade_url,
      message: response.message
    });
    return response;
  }
  async verifySms(phone_number, token) {
    const path = "/api/v1/me/verify-sms";
    const key = "verify_sms";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, { phone_number, token }, { key });
    this.emit("api:VerifySms", response);
    return response;
  }
  parseParams(params = {}) {
    const {
      limit = 40,
      stickers,
      keychains,
      ...rest
    } = params;
    const query = {
      ...rest,
      limit
    };
    if (stickers) {
      query.stickers = JSON.stringify(stickers);
    }
    if (keychains) {
      query.keychains = JSON.stringify(keychains);
    }
    return query;
  }
  async getListings(params = {}) {
    const path = "/api/v1/listings";
    const key = "listing";
    if (params.limit === 0) {
      params.limit = 40;
    }
    if (params.limit && ((params == null ? void 0 : params.limit) < 1 || (params == null ? void 0 : params.limit) > 50)) {
      console.warn("Limit must be between 1 and 50, defaulting to 40");
      params.limit = 40;
    }
    await this.rateLimiter.ensureAvailable(key);
    const query = this.parseParams(params);
    const response = await this.get(path, { params: query, key });
    this.cache.listings = this.cache.listings || {};
    for (const listing of response.data || []) {
      this.cache.listings[listing.id] = listing;
    }
    this.emit("api:UpdateListings", response.data);
    return response;
  }
  async getListingBuyOrders(listingId, limit = 10) {
    const path = `/api/v1/listings/${listingId}/buy-orders`;
    const key = "buy_orders";
    if (limit === 0 || limit < 1 || limit > 25) {
      console.warn("Limit must be between 1 and 25, defaulting to 10");
      limit = 10;
    }
    await this.rateLimiter.ensureAvailable(key);
    const res = await this.get(path, { refererUrl: "https://csfloat.com/item/" + listingId, limit, key });
    this.emit("api:UpdateListingBuyOrders", {
      listingId,
      buyOrders: res
    });
    return res;
  }
  async getListingSales(listingId) {
    const path = `/api/v1/listings/${listingId}/sales`;
    const key = "sales";
    await this.rateLimiter.ensureAvailable(key);
    const res = await this.get(path, { refererUrl: "https://csfloat.com/item/" + listingId, key });
    this.emit("api:UpdateSalesItems", {
      listingId,
      salesItems: res
    });
    return res;
  }
  async getListingSimilar(listingId) {
    const path = `/api/v1/listings/${listingId}/similar`;
    const key = "similar";
    await this.rateLimiter.ensureAvailable(key);
    const res = await this.get(path, { refererUrl: "https://csfloat.com/item/" + listingId, key });
    this.emit("api:UpdateSimilarItems", {
      listingId,
      similarItems: res
    });
  }
  async getItemHistory(market_hash_name, paint_index) {
    const path = `/api/v1/history/${market_hash_name}/graph`;
    const key = "history";
    await this.rateLimiter.ensureAvailable(key);
    const res = await this.get(path, { paint_index, key });
    this.cache.itemHistory = this.cache.itemHistory || {};
    this.cache.itemHistory[`${market_hash_name}-${paint_index}`] = res;
    this.emit("api:UpdateItemHistory", {
      market_hash_name,
      paint_index,
      history: res
    });
    return res;
  }
  async bitItem(listingId, max_price) {
    const path = `/api/v1/listings/${listingId}/bit`;
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    if (max_price < 0) {
      throw new Error("Max price must be a positive number");
    }
    const response = await this.post(path, { max_price }, { key });
    this.emit("api:BitItem", response);
    return response;
  }
  async getMobileStatus() {
    const path = "/api/v1/me/mobile/status";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const res = await this.get(path, { key });
    const status = res.status === "active";
    this.emit("api:UpdateMobileStatus", {
      status,
      message: res.message || "Mobile status retrieved successfully"
    });
    return res;
  }
  async newTradeOffer(options) {
    const path = "/api/v1/trades/steam-status/new-offer";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    if (!options.given_asset_ids || !options.received_asset_ids) {
      throw new Error("Both given_asset_ids and received_asset_ids must be provided");
    }
    if (options.given_asset_ids.length === 0 || options.received_asset_ids.length === 0) {
      throw new Error("Both given_asset_ids and received_asset_ids must contain at least one item");
    }
    if (!options.offer_id) {
      throw new Error("Offer ID must be provided");
    }
    const result = await this.post(path, options, { key });
    this.emit("api:NewTradeOffer", result);
    return result;
  }
  async updateTradeOffer(options) {
    const path = "/api/v1/trades/steam-status/offer";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, options, { key });
    this.emit("api:UpdateTradeOffer", response);
    return response;
  }
  async setMobileStatus(status) {
    const path = "/api/v1/me/mobile/status";
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.post(path, { version: "8.0.0" }, { key });
    this.emit("api:UpdateMobileStatus", {
      status,
      message: response.message
    });
    return response;
  }
  async changeListingPrice(listingId, newPrice) {
    const path = `/api/v1/listings/${listingId}`;
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    if (newPrice < 0) {
      throw new Error("New price must be a positive number");
    }
    const response = await this.patch(path, { price: newPrice }, { key });
    this.cache.listings = this.cache.listings || {};
    this.cache.listings[listingId] = response;
    return response;
  }
  async getListingById(listingId) {
    const path = `/api/v1/listings/${listingId}`;
    const key = "main";
    await this.rateLimiter.ensureAvailable(key);
    const response = await this.get(path, { refererUrl: "https://csfloat.com/item/" + listingId, key });
    this.cache.listings = this.cache.listings || {};
    this.cache.listings[listingId] = response;
    this.emit("api:UpdateListing", response);
    return response;
  }
  getRateLimit(key = "main") {
    return this.rateLimiter.getInfo(key);
  }
  getRateLimits() {
    return this.rateLimiter.getAll();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CsFloatClient
});
//# sourceMappingURL=index.js.map