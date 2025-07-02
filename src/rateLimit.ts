import { EventEmitter } from "events";

export interface IRateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

export class RateLimiter extends EventEmitter {
    private limits = new Map<string, IRateLimitInfo>();

    update(headers: Record<string, any>, key = 'main') {
        const limit = parseInt(headers['x-ratelimit-limit'] ?? '0');
        const remaining = parseInt(headers['x-ratelimit-remaining'] ?? '1');
        const reset = parseInt(headers['x-ratelimit-reset'] ?? `${Math.floor(Date.now() / 1000)}`);

        if (!isNaN(limit)) {
            this.limits.set(key, { limit, remaining, reset });
        }
        this.emit('rateLimit:Update', key, { limit, remaining, reset });
    }

    on<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
        super.on(eventName, listener);

        return this;
    }

    async ensureAvailable(key = 'main') {
        const info = this.limits.get(key);
        if (!info) return;

        const { remaining, reset } = info;

        if (remaining <= 0) {
            const now = Math.floor(Date.now() / 1000);
            const wait = reset - now;
            if (wait > 0) {
                console.warn(`[RateLimit] [${key}] waiting ${wait}s`);
                await new Promise((resolve) => setTimeout(resolve, wait * 1000));
            }
        }
    }

    getInfo(key = 'main'): IRateLimitInfo | undefined {
        return this.limits.get(key);
    }

    getAll() {
        const now = Math.floor(Date.now() / 1000); // текущий UNIX time в секундах

        const limits = Array.from(this.limits.entries()).map(([key, value]) => ({
            key,
            ...value,
            reset_in: Math.max(0, (value.reset - now) * 1000),
            reset_in_string: RateLimiter.formatDuration(value.reset - now),
        }));

        return {
            limits,
            keys: Array.from(this.limits.keys()),
        };
    }

    getKeys(): string[] {
        return [...this.limits.keys()];
    }

    static formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);

        return `resets in ${parts.join(' ')}`;
    }

}
