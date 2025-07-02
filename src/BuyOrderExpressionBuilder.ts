import { RarityNameMap } from "./types";
import { Rarity } from "./enums";
import { SchemaFetcher } from "./SchemaFetcher";

// Типы операторов
export type EqualityOperator = '==' | '!=';
export type ComparisonOperator = '>' | '>=' | '<' | '<=';
export type HasOperator = 'has';
export type Operator = EqualityOperator | ComparisonOperator | HasOperator;

export type BuyOrderField =
    | 'FloatValue'
    | 'Stickers'
    | 'PaintSeed'
    | 'StatTrak'
    | 'Souvenir'
    | 'Rarity'
    | 'DefIndex'
    | 'PaintIndex';

export interface IExpressionRule {
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

export interface IExpressionGroup {
    condition: 'and' | 'or';
    rules: (IExpressionRule | { expression: IExpressionGroup })[];
}
export interface SkinVariant {
    def_index: number;
    paint_index: number;
    market_hash_name: string;
    min_float: number;
    max_float: number;
    stickers: {
        id: number;
        qty?: number;
        slot?: number;
        name: string;
        market_hash_name?: string;
    }[];
    souvenir?: boolean; // если с сувениром
    stattrak?: boolean; // если статтрек
    min_paint_seed?: number; // если есть диапазон по paintSeed
    max_paint_seed?: number; // если есть диапазон по paintSeed

    // …другие нужные вам поля…
}
export interface IPlaceBuyOrderBody {
    expression: IExpressionGroup;
    max_price: number;
    quantity: number;
}

const FieldMetaMap = {
    FloatValue: { operators: ['==', '>', '>=', '<', '<='], valueType: 'number' },
    Stickers: { operators: ['has'], valueType: 'object' },
    PaintSeed: { operators: ['==', '>', '>=', '<', '<='], valueType: 'number' },
    StatTrak: { operators: ['=='], valueType: 'boolean', allowedValues: [true, false] },
    Souvenir: { operators: ['=='], valueType: 'boolean', allowedValues: [true, false] },
    Rarity: { operators: ['=='], valueType: 'number' },
    DefIndex: { operators: ['=='], valueType: 'number' },
    PaintIndex: { operators: ['=='], valueType: 'number' },
} as const;



type FieldMetaMapType = typeof FieldMetaMap;

type FieldValueType<F extends BuyOrderField> =
    FieldMetaMapType[F] extends { allowedValues: readonly (infer V)[] }
    ? V
    : FieldMetaMapType[F]['valueType'] extends 'number' ? number
    : FieldMetaMapType[F]['valueType'] extends 'boolean' ? boolean
    : FieldMetaMapType[F]['valueType'] extends 'string' ? string
    : any;


export class BuyOrderExpressionBuilder {
    private root: IExpressionGroup = { condition: 'and', rules: [] };
    constructor(stringInput?: string) {
        if (stringInput) {
            this.root = BuyOrderExpressionBuilder.parse(stringInput);
        }
    }
    getExpression(): IExpressionGroup {
        return this.root;
    }

    public async getSkinVariants(): Promise<SkinVariant[]> {
        // 1) получаем «сырые» развёрнутые правила
        const rawVariants = BuyOrderExpressionBuilder.expandVariants(this.root);
        console.log('Raw variants:', rawVariants);

        // 2) для каждой развёрнутой ветки собираем SkinVariant
        return Promise.all(rawVariants.map(async (rules) => {
            // 2.1) defIndex / paintIndex
            const defRule = rules.find(r => r.field === 'DefIndex')!.value.constant!;
            const paintRule = rules.find(r => r.field === 'PaintIndex')!.value.constant!;

            // 2.2) market_hash_name оружия
            const weapon = await SchemaFetcher.getWeapon(defRule, paintRule);
            if (!weapon) {
                throw new Error(`❌ Weapon with DefIndex ${defRule} and PaintIndex ${paintRule} not found`);
            }



            // 2.3) float
            const floatRule = rules.filter(r => r.field === 'FloatValue');
            let minFloat: number = 0, maxFloat: number = 1;
            if (floatRule.length === 0) {
                minFloat = 0;
                maxFloat = 1;
            } else if (floatRule.length === 1) {
                const rule = floatRule.find(r => r.operator === '==');
                if (rule) {
                    const floatValue = parseFloat(rule.value.constant!);
                    minFloat = floatValue;
                    maxFloat = floatValue;
                } else {
                    const minRule = floatRule.find(r => r.operator === '>') || floatRule.find(r => r.operator === '>=');
                    const maxRule = floatRule.find(r => r.operator === '<') || floatRule.find(r => r.operator === '<=');
                    if (minRule) {
                        minFloat = parseFloat(minRule.value.constant!);
                    }
                    if (maxRule) {
                        maxFloat = parseFloat(maxRule.value.constant!);
                    }
                }
            } else if (floatRule.length === 2) {
                const minRule = floatRule.find(r => r.operator === '>') || floatRule.find(r => r.operator === '>=');
                const maxRule = floatRule.find(r => r.operator === '<') || floatRule.find(r => r.operator === '<=');
                if (minRule && maxRule) {
                    minFloat = parseFloat(minRule.value.constant!);
                    maxFloat = parseFloat(maxRule.value.constant!);
                }
            }

            // 2.4) rarity
            const rarityRule = rules.find(r => r.field === 'Rarity');
            let rarity: Rarity | undefined;
            if (rarityRule) {
                const rarityValue = rarityRule.value.constant!;
                try {
                    rarity = BuyOrderExpressionBuilder.parseRarity(rarityValue);
                } catch (error) {
                    console.error(`❌ Invalid rarity value: ${rarityValue}`, error);
                }
            }

            // 2.5) stattrak
            const stattrakRule = rules.find(r => r.field === 'StatTrak');
            let stattrak: boolean | undefined;
            if (stattrakRule) {
                const stattrakValue = stattrakRule.value.constant!;
                if (stattrakValue === 'true') {
                    stattrak = true;
                } else if (stattrakValue === 'false') {
                    stattrak = false;
                } else {
                    console.error(`❌ Invalid StatTrak value: ${stattrakValue}`);
                }
            }

            // 2.6) souvenir
            const souvenirRule = rules.find(r => r.field === 'Souvenir');
            let souvenir: boolean | undefined;
            if (souvenirRule) {
                const souvenirValue = souvenirRule.value.constant!;
                if (souvenirValue === 'true') {
                    souvenir = true;
                } else if (souvenirValue === 'false') {
                    souvenir = false;
                } else {
                    console.error(`❌ Invalid Souvenir value: ${souvenirValue}`);
                }
            }
            // 2.7) paintSeed
            const paintSeedRule = rules.filter(r => r.field === 'PaintSeed');
            let minPaintSeed: number | undefined, maxPaintSeed: number | undefined;
            if (paintSeedRule.length == 1) {
                const rule = paintSeedRule.find(r => r.operator === '==');
                if (rule) {
                    minPaintSeed = parseInt(rule.value.constant!, 10);
                    maxPaintSeed = minPaintSeed;
                }
                else {
                    const minRule = paintSeedRule.find(r => r.operator === '>') || paintSeedRule.find(r => r.operator === '>=');
                    const maxRule = paintSeedRule.find(r => r.operator === '<') || paintSeedRule.find(r => r.operator === '<=');

                    if (minRule) {
                        minPaintSeed = parseInt(minRule.value.constant!, 10);
                    }
                    if (maxRule) {
                        maxPaintSeed = parseInt(maxRule.value.constant!, 10);
                    }
                }
            }
            else if (paintSeedRule.length === 2) {
                const minRule = paintSeedRule.find(r => r.operator === '>') || paintSeedRule.find(r => r.operator === '>=');
                const maxRule = paintSeedRule.find(r => r.operator === '<') || paintSeedRule.find(r => r.operator === '<=');
                if (minRule) {
                    minPaintSeed = parseInt(minRule.value.constant!, 10);
                }
                if (maxRule) {
                    maxPaintSeed = parseInt(maxRule.value.constant!, 10);
                }
            }

            // 2.4) stickers — ищем все правила field==='Stickers'
            const stickerRules = rules.filter(r =>
                r.field === 'Stickers' && r.operator === 'has' && typeof r.value === 'object'
            );

            // 2.5) делаем Promise для каждого: фетчим инфу из SchemaFetcher
            const stickers = await Promise.all(stickerRules.map(async r => {
                const { id, qty, slot } = (r.value as any).sticker;
                const info = await SchemaFetcher.getStickerById(id);
                // при наличии метода getStickerByMarketHashName для стикеров можно его тоже вызвать:
                // const marketHashName = await SchemaFetcher.getStickerByMarketHashName(id);
                return {
                    id,
                    qty,
                    slot,
                    name: info?.sticker.market_hash_name || `Sticker #${id}`,
                };
            }));

            const marketHashName = await SchemaFetcher.getWeaponMarketHashNames(weapon, minFloat, maxFloat, stattrak, souvenir);
            if (!marketHashName) {
                throw new Error(`❌ Market hash name for weapon with DefIndex ${defRule} and PaintIndex ${paintRule} not found`);
            }
            return {
                def_index: weapon.defIndex,
                paint_index: weapon.paintIndex,
                market_hash_name: marketHashName[0].market_hash_name,
                min_float: minFloat,
                max_float: maxFloat,
                stickers,
                souvenir,
                stattrak,
                min_paint_seed: minPaintSeed,
                max_paint_seed: maxPaintSeed,
            } as SkinVariant;
        }));
    }

    private static expandVariants(group: IExpressionGroup): IExpressionRule[][] {
        if (group.condition === 'and') {
            let results: IExpressionRule[][] = [[]];
            for (const ruleOrGroup of group.rules) {
                const branchVariants: IExpressionRule[][] = [];
                if ('field' in ruleOrGroup) {
                    branchVariants.push([ruleOrGroup]);
                } else {
                    BuyOrderExpressionBuilder
                        .expandVariants(ruleOrGroup.expression)
                        .forEach(v => branchVariants.push(v));
                }
                const next: IExpressionRule[][] = [];
                for (const prev of results) {
                    for (const branch of branchVariants) {
                        next.push([...prev, ...branch]);
                    }
                }
                results = next;
            }
            return results;
        }
        // OR
        const orResults: IExpressionRule[][] = [];
        for (const ruleOrGroup of group.rules) {
            if ('field' in ruleOrGroup) {
                orResults.push([ruleOrGroup]);
            } else {
                BuyOrderExpressionBuilder
                    .expandVariants(ruleOrGroup.expression)
                    .forEach(v => orResults.push(v));
            }
        }
        return orResults;
    }

    public createExpressionsFromVariants(variants: SkinVariant[]): this {
        if (!variants.length) {
            throw new Error('Нужен хотя бы один вариант');
        }

        // 1) «Сбрасываем» дерево в AND
        this.root = { condition: 'and', rules: [] };
        const first = variants[0];

        // Вспомогательная функция для проверки «все ли варианты согласны по полю»
        const allEqual = <K extends keyof SkinVariant>(key: K) =>
            variants.every(v => JSON.stringify((v as any)[key]) === JSON.stringify((first as any)[key]));

        // 2) Дефолтный порядок обработки полей:
        //    a) def_index, paint_index
        //    b) float (min/max)
        //    c) paint_seed (min/max)
        //    d) stattrak, souvenir
        //    e) stickers
        // В этом порядке либо пушим «AND»-правило, либо «OR»-группу

        // a) def_index
        if (allEqual('def_index')) {
            this.root.rules.push({
                field: 'defIndex' as BuyOrderField,
                operator: '==' as Operator,
                value: { constant: String(first.def_index) },
            });
        } else {
            // сюда обычно не попадём, т.к. def_index у вас общий
            this.pushOrGroup(
                variants,
                v => [
                    {
                        field: 'defIndex' as BuyOrderField,
                        operator: '==' as Operator,
                        value: { constant: String(v.def_index) },
                    },
                ]
            );
        }

        // a2) paint_index
        if (allEqual('paint_index')) {
            this.root.rules.push({
                field: 'paintIndex' as BuyOrderField,
                operator: '==' as Operator,
                value: { constant: String(first.paint_index) },
            });
        } else {
            this.pushOrGroup(
                variants,
                v => [
                    {
                        field: 'paintIndex' as BuyOrderField,
                        operator: '==' as Operator,
                        value: { constant: String(v.paint_index) },
                    },
                ]
            );
        }

        // b) float
        if (allEqual('min_float') && allEqual('max_float')) {
            if (first.min_float === first.max_float) {
                this.root.rules.push({
                    field: 'floatValue' as BuyOrderField,
                    operator: '==' as Operator,
                    value: { constant: String(first.min_float) },
                });
            } else {
                this.root.rules.push(
                    {
                        field: 'floatValue' as BuyOrderField,
                        operator: '>=' as Operator,
                        value: { constant: String(first.min_float) },
                    },
                    {
                        field: 'floatValue' as BuyOrderField,
                        operator: '<=' as Operator,
                        value: { constant: String(first.max_float) },
                    }
                );
            }
        } else {
            this.pushOrGroup(
                variants,
                v => {
                    const rules: IExpressionRule[] = [];
                    if (v.min_float === v.max_float) {
                        rules.push({
                            field: 'floatValue' as BuyOrderField,
                            operator: '==' as Operator,
                            value: { constant: String(v.min_float) },
                        });
                    } else {
                        rules.push(
                            {
                                field: 'floatValue' as BuyOrderField,
                                operator: '>=' as Operator,
                                value: { constant: String(v.min_float) },
                            },
                            {
                                field: 'floatValue' as BuyOrderField,
                                operator: '<=' as Operator,
                                value: { constant: String(v.max_float) },
                            }
                        );
                    }
                    return rules;
                }
            );
        }

        // c) paint_seed
        if (allEqual('min_paint_seed') && allEqual('max_paint_seed')) {
            if (first.min_paint_seed !== undefined && first.max_paint_seed !== undefined) {
                if (first.min_paint_seed === first.max_paint_seed) {
                    this.root.rules.push({
                        field: 'paintSeed' as BuyOrderField,
                        operator: '==' as Operator,
                        value: { constant: String(first.min_paint_seed) },
                    });
                } else {
                    this.root.rules.push(
                        {
                            field: 'paintSeed' as BuyOrderField,
                            operator: '>=' as Operator,
                            value: { constant: String(first.min_paint_seed) },
                        },
                        {
                            field: 'paintSeed' as BuyOrderField,
                            operator: '<=' as Operator,
                            value: { constant: String(first.max_paint_seed) },
                        }
                    );
                }
            }
        } else {
            this.pushOrGroup(
                variants,
                v => {
                    const rules: IExpressionRule[] = [];
                    if (v.min_paint_seed !== undefined && v.max_paint_seed !== undefined) {
                        if (v.min_paint_seed === v.max_paint_seed) {
                            rules.push({
                                field: 'paintSeed' as BuyOrderField,
                                operator: '==' as Operator,
                                value: { constant: String(v.min_paint_seed) },
                            });
                        } else {
                            rules.push(
                                {
                                    field: 'paintSeed' as BuyOrderField,
                                    operator: '>=',
                                    value: { constant: String(v.min_paint_seed) },
                                },
                                {
                                    field: 'paintSeed' as BuyOrderField,
                                    operator: '<=',
                                    value: { constant: String(v.max_paint_seed) },
                                }
                            );
                        }
                    }
                    return rules;
                }
            );
        }

        // d) stattrak
        if (allEqual('stattrak')) {
            if (first.stattrak !== undefined) {
                this.root.rules.push({
                    field: 'StatTrak' as BuyOrderField,
                    operator: '==' as Operator,
                    value: { constant: String(first.stattrak) },
                });
            }
        } else {
            this.pushOrGroup(
                variants,
                v => [
                    {
                        field: 'StatTrak' as BuyOrderField,
                        operator: '==' as Operator,
                        value: { constant: String(Boolean(v.stattrak)) },
                    },
                ]
            );
        }

        // d2) souvenir
        if (allEqual('souvenir')) {
            if (first.souvenir !== undefined) {
                this.root.rules.push({
                    field: 'Souvenir' as BuyOrderField,
                    operator: '==' as Operator,
                    value: { constant: String(first.souvenir) },
                });
            }
        } else {
            this.pushOrGroup(
                variants,
                v => [
                    {
                        field: 'Souvenir' as BuyOrderField,
                        operator: '==' as Operator,
                        value: { constant: String(Boolean(v.souvenir)) },
                    },
                ]
            );
        }

        // e) stickers
        if (allEqual('stickers')) {
            // общие стикеры — просто AND
            for (const st of first.stickers) {
                this.root.rules.push({
                    field: 'Stickers' as BuyOrderField,
                    operator: 'has' as Operator,
                    value: {
                        sticker: {
                            id: st.id,
                            ...(st.qty !== undefined ? { qty: st.qty } : {}),
                            ...(st.slot !== undefined ? { slot: st.slot } : {}),
                        },
                    },
                });
            }
        } else {
            // вариативные стикеры — OR-группа
            this.pushOrGroup(
                variants,
                v => v.stickers.map(st => ({
                    field: 'Stickers' as BuyOrderField,
                    operator: 'has' as Operator,
                    value: {
                        sticker: {
                            id: st.id,
                            ...(st.qty !== undefined ? { qty: st.qty } : {}),
                            ...(st.slot !== undefined ? { slot: st.slot } : {}),
                        },
                    },
                }))
            );
        }

        return this;
    }

    /** Утилита: по массиву вариантов делает вложенную OR-группу */
    private pushOrGroup(
        variants: SkinVariant[],
        mapToRules: (v: SkinVariant) => IExpressionRule[]
    ) {
        const orGroup: IExpressionGroup = { condition: 'or', rules: [] };
        for (const v of variants) {
            orGroup.rules.push(...mapToRules(v));
        }
        this.root.rules.push({ expression: orGroup });
    }
    static parse(input?: string): IExpressionGroup {
        if (!input || typeof input !== 'string') {
            throw new Error("❌ Input must be a non-empty string");
        }
        if (!input.includes('=')) {
            throw new Error("Don't provide here an market hash name, use 'getWeaponByMarketHashName' method instead");
        }
        const builder = new BuyOrderExpressionBuilder();

        const expression = this._parseExpression(input);
        return expression;
    }
    private static _wrapIfNeeded(group: IExpressionGroup): IExpressionRule | { expression: IExpressionGroup } {
        const isSingleRule = group.rules.length === 1 && 'field' in group.rules[0];
        return isSingleRule ? group.rules[0] as IExpressionRule : { expression: group };
    }

    private static _parseExpression(input: string): IExpressionGroup {
        if (input.startsWith('(') && input.endsWith(')')) {
            input = input.slice(1, -1);
        }

        const andParts = this._splitByTopLevel(input, 'and');
        if (andParts.length > 1) {
            return {
                condition: 'and',
                rules: andParts.map(part => {
                    const parsed = this._parseExpression(part.trim());
                    return this._wrapIfNeeded(parsed);
                }),
            };
        }

        const orParts = this._splitByTopLevel(input, 'or');
        if (orParts.length > 1) {
            return {
                condition: 'or',
                rules: orParts.map(part => {
                    const parsed = this._parseExpression(part.trim());
                    return this._wrapIfNeeded(parsed);
                }),
            };
        }

        const stickerMatch = input.match(/HasSticker\((\d+),\s*(-?\d+),\s*(\d+)\)/);
        if (stickerMatch) {
            const [, idStr, slotStr, qtyStr] = stickerMatch;
            const id = Number(idStr);
            const qty = Number(qtyStr);
            const slot = Number(slotStr);
            return {
                condition: 'and',
                rules: [{
                    field: 'Stickers',
                    operator: 'has',
                    value: {
                        sticker: { id, qty, slot },
                    },
                }],
            };
        }

        // Обработка обычных сравнений
        const opMatch = input.match(/(DefIndex|PaintIndex|FloatValue|StatTrak|Souvenir|Rarity|PaintSeed)\s*(==|>=|<=|<|>)\s*(.+)/);
        if (opMatch) {
            const [, field, operator, rawValue] = opMatch;
            let value: any = rawValue.trim();

            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value))) value = Number(value);

            return {
                condition: 'and',
                rules: [{
                    field: field as BuyOrderField,
                    operator: operator as Operator,
                    value: { constant: String(value) },
                }],
            };
        }

        throw new Error(`❌ Не удалось разобрать выражение: ${input}`);
    }

    private static _splitByTopLevel(input: string, separator: 'and' | 'or'): string[] {
        const parts: string[] = [];
        let depth = 0;
        let current = '';

        const tokens = input.split(/(\s+|\(|\))/).filter(Boolean);

        for (const token of tokens) {
            if (token === '(') depth++;
            if (token === ')') depth--;
            if (depth === 0 && token.trim() === separator) {
                parts.push(current.trim());
                current = '';
            } else {
                current += token;
            }
        }

        if (current) parts.push(current.trim());
        return parts;
    }

    addRule<F extends BuyOrderField>(
        field: F,
        operator: FieldMetaMapType[F]['operators'][number],
        value: FieldValueType<F>
    ): this {
        this.validateOperator(field, operator);
        this.validateValue(field, value);

        this.root.rules.push({
            field,
            operator,
            value: { constant: String(value) },
        });
        return this;
    }



    addStickerRule(stickerId: number, options: { qty?: number; slot?: number }): this {
        const { qty, slot } = options;
        if ((qty === undefined && slot === undefined) || (qty !== undefined && slot !== undefined)) {
            throw new Error("❌ Sticker rule must have either 'qty' or 'slot', but not both");
        }

        this.root.rules.push({
            field: 'Stickers',
            operator: 'has',
            value: {
                sticker: {
                    id: stickerId,
                    ...(qty !== undefined ? { qty } : {}),
                    ...(slot !== undefined ? { slot } : {}),
                },
            },
        });
        return this;
    }

    addGroup(condition: 'and' | 'or', callback: (group: BuyOrderExpressionBuilder) => void): this {
        const subBuilder = new BuyOrderExpressionBuilder();
        callback(subBuilder);
        this.root.rules.push({
            expression: {
                condition,
                rules: subBuilder.root.rules,
            },
        });
        return this;
    }

    buildExpression(): IExpressionGroup {
        return this.root;
    }

    buildBuyOrder(max_price: number, quantity: number): IPlaceBuyOrderBody {
        if (typeof quantity !== 'number' || quantity <= 0) {
            throw new Error("❌ 'quantity' must be a positive number");
        }
        this.ensureRequiredFields(['DefIndex', 'PaintIndex']);
        return {
            expression: this.root,
            max_price,
            quantity,
        };
    }

    public static parseRarity(value: string): Rarity {
        const normalized = value.trim().toLowerCase();
        if (!(normalized in RarityNameMap)) {
            throw new Error(`❌ Unknown rarity name: '${value}'`);
        }
        return RarityNameMap[normalized];
    }


    private validateOperator<F extends keyof FieldMetaMapType>(
        field: F,
        operator: FieldMetaMapType[F]['operators'][number]
    ): void {
        const allowedOperators = FieldMetaMap[field].operators;
        const operators = [...allowedOperators];
        if (!operators.includes(operator)) {
            throw new Error(`❌ Operator '${operator}' not allowed for '${field}'. Allowed: ${operators.join(', ')}`);
        }
    }



    private validateValue(field: BuyOrderField, value: any): void {
        const meta = FieldMetaMap[field];
        const actualType = typeof value;

        if (meta.valueType !== 'object' && actualType !== meta.valueType) {
            throw new Error(`❌ Invalid value type for '${field}'. Expected ${meta.valueType}, got ${actualType}`);
        }

        // Проверка допустимых значений, если они определены
        if ('allowedValues' in meta && Array.isArray(meta.allowedValues)) {
            if (!meta.allowedValues.includes(value)) {
                throw new Error(`❌ Invalid value for '${field}'. Allowed values: ${meta.allowedValues.join(', ')}`);
            }
        }
    }


    private ensureRequiredFields(requiredFields: BuyOrderField[]): void {
        const flatRules = this.flattenRules(this.root);
        for (const field of requiredFields) {
            if (!flatRules.some(rule => 'field' in rule && rule.field === field)) {
                throw new Error(`❌ Missing required field '${field}' in expression.`);
            }
        }
    }

    private flattenRules(group: IExpressionGroup): (IExpressionRule | IExpressionGroup)[] {
        const result: (IExpressionRule | IExpressionGroup)[] = [];
        for (const rule of group.rules) {
            if ('field' in rule) {
                result.push(rule);
            } else if ('expression' in rule) {
                result.push(...this.flattenRules(rule.expression));
            }
        }
        return result;
    }

}
