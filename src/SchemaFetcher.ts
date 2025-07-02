import axios from 'axios';

const SCHEMA_URL = 'https://csfloat.com/api/v1/schema/';
const QUALITIES = [
    { name: 'Factory New', max: 0.07 },
    { name: 'Minimal Wear', max: 0.15 },
    { name: 'Field-Tested', max: 0.38 },
    { name: 'Well-Worn', max: 0.45 },
    { name: 'Battle-Scarred', max: 1.00 },
];
export interface IMarketHashVariant {
    market_hash_name: string;
    quality: string;
    stattrak: boolean;
    souvenir: boolean;
}
export interface IPaintVariants {
    qualities: string[];
    stattrak: boolean;
    souvenir: boolean;
}
export interface ISchemaCollectionItem {
    key: string;
    name: string;
    has_crate?: boolean;
}

export interface ISchemaRarityItem {
    key: string;
    name: string;
    value: number;
}
export interface ISchemaSticker {
    market_hash_name: string;
}
export interface ISchemaKeychain {
    market_hash_name: string;
}
export interface ISchemaCollectibles {
    market_hash_name: string;
    image: string;
    rarity: number;
    price: number;
}
export interface ISchemaContainer {
    market_hash_name: string;
}
export interface ISchemaAgent {
    market_hash_name: string;
    image: string;
    rarity: number;
    price: number;
}
export interface ISchemaCustomSticker {
    group: number;
    name: string;
    count: number;
}
type CustomStickerKey = `C${string}`;

export interface ISchemaMusicKit {
    market_hash_name: string;
    rarity: number;
    image: string;
    normal_price: number;
    stattrak_price: number;
}


export interface IPaintData {
    index: number;
    name: string;
    max: number;
    min: number;
    rarity: number;
    collection: string;
    image: string;
    souvenir?: boolean;
    stattrak?: boolean;
    normal_prices: number[];
    normal_volume: number[];
    stattrak_prices?: number[];
    stattrak_volume?: number[];
}
export type SchemaWeaponTypes = 'Weapons' | 'Gloves' | 'Knives';
export interface ISchemaWeapon {
    name: string;
    type: SchemaWeaponTypes;
    sticker_amount: number;
    paints: Record<string, IPaintData>;
}

export interface ISchemaResponse {
    collections: ISchemaCollectionItem[];
    rarities: ISchemaRarityItem[];
    stickers: Record<string, ISchemaSticker>;
    keychains: Record<string, ISchemaKeychain>;
    collectibles: Record<string, ISchemaCollectibles>;
    containers: Record<string, ISchemaContainer>;

    agents: Record<string, ISchemaAgent>;
    custom_stickers: Record<CustomStickerKey, ISchemaCustomSticker>;
    music_kits: Record<string, ISchemaMusicKit>;
    weapons: Record<string, ISchemaWeapon>;
}
const SCHEMA_TTL_MS = 24 * 60 * 60 * 1000;

export class SchemaFetcher {
    private static data: ISchemaResponse | null = null;
    private static lastDataFetch: number | null = null;
    private static loaded = false;
    private static loadingPromise: Promise<void> | null = null;

    // private static async shouldRefresh(): Promise<boolean> {
    //     try {
    //         const stats = await fs.stat(SCHEMA_PATH);
    //         const age = Date.now() - stats.mtimeMs;
    //         return age > SCHEMA_TTL_MS;
    //     } catch {
    //         return true;
    //     }
    // }
    private static async shouldRefresh(): Promise<boolean> {
        const now = Date.now();
        if (!this.lastDataFetch) {
            return true;
        }
        return now - this.lastDataFetch > SCHEMA_TTL_MS;
    }
    static async load(): Promise<void> {
        const refresh = await this.shouldRefresh();
        if (this.loaded && this.data && !refresh) return;

        await this.fetchAndSave();

        this.loaded = true;
    }

    static async fetchAndSave(): Promise<void> {
        try {
            const res = await axios.get<ISchemaResponse>(SCHEMA_URL);
            this.data = res.data;
            this.lastDataFetch = Date.now();

            //await fs.mkdir(path.dirname(SCHEMA_PATH), { recursive: true });
            //await fs.writeFile(SCHEMA_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (err) {
            console.error('❌ Failed to fetch or save schema:', err);
        }
    }

    // static async loadFromFile(): Promise<ISchemaResponse | null> {
    //     try {
    //         const raw = await fs.readFile(SCHEMA_PATH, 'utf-8');
    //         this.data = JSON.parse(raw);
    //         return this.data;
    //     } catch (err) {
    //         console.warn('⚠️ Failed to load schema from file:', err);
    //         return null;
    //     }
    // }
    static async setLoading(): Promise<void> {
        const refresh = await this.shouldRefresh();
        if (this.loaded && this.data && !refresh) return;
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.load();
        return this.loadingPromise;
    }

    static async checkLoading(): Promise<void> {
        if (!this.loaded) {
            await this.setLoading();
        }
    }

    static async getCollections(): Promise<ISchemaCollectionItem[]> {
        await this.checkLoading();

        return this.data?.collections ?? [];
    }
    static async getCollectionByKey(key: string): Promise<ISchemaCollectionItem | null> {
        await this.checkLoading();

        return this.data?.collections.find(c => c.key === key) ?? null;
    }
    static async getCollectionsByName(name: string): Promise<ISchemaCollectionItem | null> {
        await this.checkLoading();

        return this.data?.collections.find(c => c.name === name) ?? null;
    }


    static async getRarities(): Promise<ISchemaRarityItem[]> {
        await this.checkLoading();

        return this.data?.rarities ?? [];
    }
    static async getRarityByKey(key: string): Promise<ISchemaRarityItem | null> {
        await this.checkLoading();

        return this.data?.rarities.find(r => r.key === key) ?? null;
    }
    static async getRarityByName(name: string): Promise<ISchemaRarityItem | null> {
        await this.checkLoading();

        return this.data?.rarities.find(r => r.name === name) ?? null;
    }
    static async getRaritiesByValue(value: number): Promise<ISchemaRarityItem | null> {
        await this.checkLoading();

        return this.data?.rarities.find(r => r.value === value) ?? null;
    }

    static async getStickers(): Promise<Record<string, ISchemaSticker>> {
        await this.checkLoading();

        return this.data?.stickers ?? {};
    }
    static async getStickerByMarketHashName(market_hash_name: string): Promise<{ id: string; sticker: ISchemaSticker } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.stickers ?? {}).find(
            ([_, sticker]) => sticker.market_hash_name === market_hash_name
        );

        if (!entry) return null;

        const [id, sticker] = entry;
        return { id, sticker };
    }

    static async getStickerById(id: string): Promise<{ id: string; sticker: ISchemaSticker } | null> {
        await this.checkLoading();

        if (!this.data?.stickers[id]) {
            return null;
        }
        return {
            id: id,
            sticker: this.data?.stickers[id] ?? null
        };
    }

    static async getKeychains(): Promise<Record<string, ISchemaKeychain>> {
        await this.checkLoading();

        return this.data?.keychains ?? {};
    }
    static async getKeychainByMarketHashName(market_hash_name: string): Promise<{ id: string; keychain: ISchemaKeychain } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.keychains ?? {}).find(
            ([_, keychain]) => keychain.market_hash_name === market_hash_name
        );

        if (!entry) return null;

        const [id, keychain] = entry;
        return { id, keychain };
    }
    static async getKeychainById(id: string): Promise<{ id: string; keychain: ISchemaKeychain } | null> {
        await this.checkLoading();

        if (!this.data?.keychains[id]) {
            return null;
        }
        return {
            id: id,
            keychain: this.data?.keychains[id] ?? null
        };
    }

    static async getCollectibles(): Promise<Record<string, ISchemaCollectibles>> {
        await this.checkLoading();

        return this.data?.collectibles ?? {};
    }
    static async getCollectibleByMarketHashName(market_hash_name: string): Promise<{ id: string; collectible: ISchemaCollectibles } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.collectibles ?? {}).find(
            ([_, collectible]) => collectible.market_hash_name === market_hash_name
        );

        if (!entry) return null;

        const [id, collectible] = entry;
        return { id, collectible };
    }
    static async getCollectibleById(id: string): Promise<{ id: string; collectible: ISchemaCollectibles } | null> {
        await this.checkLoading();

        if (!this.data?.collectibles[id]) {
            return null;
        }
        return {
            id: id,
            collectible: this.data?.collectibles[id] ?? null
        };
    }

    static async getContainers(): Promise<Record<string, ISchemaContainer>> {
        await this.checkLoading();

        return this.data?.containers ?? {};
    }
    static async getContainerByMarketHashName(market_hash_name: string): Promise<{ id: string; container: ISchemaContainer } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.containers ?? {}).find(
            ([_, container]) => container.market_hash_name === market_hash_name
        );

        if (!entry) return null;

        const [id, container] = entry;
        return { id, container };
    }
    static async getContainerById(id: string): Promise<{ id: string; container: ISchemaContainer } | null> {
        await this.checkLoading();

        if (!this.data?.containers[id]) {
            return null;
        }
        return {
            id: id,
            container: this.data?.containers[id] ?? null
        };
    }

    static async getAgents(): Promise<Record<string, ISchemaAgent>> {
        await this.checkLoading();

        return this.data?.agents ?? {};
    }
    static async getAgentByMarketHashName(market_hash_name: string): Promise<{ id: string; agent: ISchemaAgent } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.agents ?? {}).find(
            ([_, agent]) => agent.market_hash_name === market_hash_name
        );

        if (!entry) return null;

        const [id, agent] = entry;
        return { id, agent };
    }
    static async getAgentById(id: string): Promise<{ id: string; agent: ISchemaAgent } | null> {
        await this.checkLoading();

        if (!this.data?.agents[id]) {
            return null;
        }
        return {
            id: id,
            agent: this.data?.agents[id] ?? null
        };
    }

    static async getCustomStickers(): Promise<Record<CustomStickerKey, ISchemaCustomSticker>> {
        await this.checkLoading();

        return this.data?.custom_stickers ?? {};
    }

    static async getCustomStickerByName(name: string): Promise<{ id: string; sticker: ISchemaCustomSticker } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.custom_stickers ?? {}).find(
            ([_, sticker]) => sticker.name === name
        );

        if (!entry) return null;

        const [id, sticker] = entry;
        return { id, sticker };
    }
    static async getCustomStickerByKey(key: CustomStickerKey): Promise<{ id: string; sticker: ISchemaCustomSticker } | null> {
        await this.checkLoading();

        const sticker = this.data?.custom_stickers[key] ?? null;
        return sticker ? { id: key, sticker } : null;
    }

    static async getMusicKits(): Promise<Record<string, ISchemaMusicKit>> {
        await this.checkLoading();

        return this.data?.music_kits ?? {};
    }
    static async getMusicKitByMarketHashName(market_hash_name: string): Promise<{ id: string; musicKit: ISchemaMusicKit } | null> {
        await this.checkLoading();

        const entry = Object.entries(this.data?.music_kits ?? {}).find(
            ([_, musicKit]) => musicKit.market_hash_name === market_hash_name
        );

        if (!entry) return null;

        const [id, musicKit] = entry;
        return { id, musicKit };
    }
    static async getMusicKitById(id: string): Promise<{ id: string; musicKit: ISchemaMusicKit } | null> {
        await this.checkLoading();

        if (!this.data?.music_kits[id]) {
            return null;
        }
        return {
            id: id,
            musicKit: this.data?.music_kits[id] ?? null
        };
    }

    static async getWeapons(): Promise<Record<string, ISchemaWeapon>> {
        await this.checkLoading();

        return this.data?.weapons ?? {};
    }
    static async getWeaponMarketHashNames(weapon: {
        id: string;
        defIndex: number;
        paintIndex: number;
        weapon: {
            paints: undefined;
            paint: IPaintData;
            name: string;
            type: SchemaWeaponTypes;
            sticker_amount: number;
        };
    }, minFloat: number = 0, maxFloat = 1, stattrak: boolean = false, souvenir: boolean = false): Promise<IMarketHashVariant[]> {
        await this.checkLoading();

        if (!this.data?.weapons[weapon.id]) {
            return [];
        }

        const weaponData = this.data.weapons[weapon.id];
        const paint = weaponData.paints[weapon.paintIndex];

        if (!paint) {
            return [];
        }

        return SchemaFetcher.generateAllMarketHashNamesFromPaint(weaponData, paint, stattrak ? 1 : 2, souvenir ? 1 : 2, minFloat, maxFloat);
    }

    static async getWeaponByMarketHashName(market_hash_name: string) {
        await this.checkLoading();
        const regex = /^(?<type>.+?) \| (?<name>.+?) \((?<quality>.+?)\)$/;
        const match = market_hash_name.match(regex);

        if (!match || !match.groups) {
            console.warn(`Invalid market_hash_name format: ${market_hash_name}`);
            return null;
        }
        const { type, name, quality } = match.groups;
        const weapon = Object.entries(this.data?.weapons ?? {}).find(
            ([_, w]) => w.name === type
        );

        if (!weapon) return null;
        const [id, weaponData] = weapon;

        const paint = Object.values(weaponData.paints).find(
            p => p.name === name
        );

        if (!paint) return null;

        const result = {
            id: id,
            defIndex: parseInt(id, 10),
            paintIndex: paint.index,
            weapon: {
                ...weaponData,
                paints: undefined,
                paint
            }
        };
        delete result.weapon.paints;
        return result;
    }
    static async getWeaponByDefIndex(defIndex: string): Promise<{ id: string; weapon: ISchemaWeapon } | null> {
        await this.checkLoading();

        if (!this.data?.weapons[defIndex]) {
            return null;
        }
        return {
            id: defIndex,
            weapon: this.data?.weapons[defIndex] ?? null
        };
    }
    static async getWeapon(defIndex: string, paintIndex: string) {
        await this.checkLoading();

        const weapon = this.data?.weapons[defIndex];
        if (!weapon) return null;

        const paint = weapon.paints[paintIndex];
        if (!paint) return null;

        const result = {
            id: defIndex,
            defIndex: parseInt(defIndex, 10),
            paintIndex: parseInt(paintIndex, 10),
            weapon: {
                ...weapon,
                paint,
                paints: undefined
            }
        };

        delete result.weapon.paints;

        return result;
    }


    static getPaintVariants(paint: IPaintData): IPaintVariants {
        const qualities = QUALITIES
            .filter(q => paint.max >= q.max - 0.01 && paint.min <= q.max)
            .map(q => q.name);

        return {
            qualities,
            stattrak: !!paint.stattrak || !!paint.stattrak_prices,
            souvenir: !!paint.souvenir,
        };
    }

    static generateMarketHashName(
        weaponName: string,
        paintName: string,
        quality: string,
        opts?: { stattrak?: boolean; souvenir?: boolean }
    ): string {
        const parts: string[] = [];

        if (opts?.souvenir) parts.push("Souvenir");
        if (opts?.stattrak) parts.push("StatTrak™");

        parts.push(`${weaponName} | ${paintName} (${quality})`);

        return parts.join(" ");
    }
    static generateAllMarketHashNamesFromPaint(
        weapon: ISchemaWeapon,
        paint: IPaintData,
        stattrak: number = 0,
        souvenir: number = 0,
        minFloat: number = 0,
        maxFloat: number = 1
    ) {
        const { qualities: variantQualities, stattrak: variantStattrak, souvenir: variantSouvenir } = SchemaFetcher.getPaintVariants(paint);

        const result: IMarketHashVariant[] = [];

        for (const quality of variantQualities) {
            if (paint.min > maxFloat || paint.max < minFloat) {
                continue;
            }
            if((stattrak == 0 && souvenir == 0) || (stattrak == 2 && souvenir == 2)) result.push({
                market_hash_name: SchemaFetcher.generateMarketHashName(weapon.name, paint.name, quality),
                quality,
                stattrak: false,
                souvenir: false,
            });

            if ((stattrak == 1 || stattrak == 2) && variantStattrak) {
                result.push({
                    market_hash_name: SchemaFetcher.generateMarketHashName(weapon.name, paint.name, quality, { stattrak: true }),
                    quality,
                    stattrak: true,
                    souvenir: false,
                });
            }

            if ((souvenir == 1 || souvenir == 2) && variantSouvenir) {
                result.push({
                    market_hash_name: SchemaFetcher.generateMarketHashName(weapon.name, paint.name, quality, { souvenir: true }),
                    quality,
                    stattrak: false,
                    souvenir: true,
                });
            }
        }

        return result.sort((a, b) => {
            const weight = (v: IMarketHashVariant) =>
                (v.souvenir ? 2 : 0) + (v.stattrak ? 1 : 0);
            return weight(a) - weight(b);
        });
    }
}
