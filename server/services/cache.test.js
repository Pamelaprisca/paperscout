import { describe, expect, it } from "vitest";

import { getCache, getCacheMode, setCache } from "./cache.js";

describe("cache service", () => {
  it("uses memory fallback when Redis is not configured", async () => {
    const key = `test:${Date.now()}`;
    const value = { ok: true };

    expect(getCacheMode()).toBe("memory");
    expect(await getCache(key)).toBeNull();

    await setCache(key, value, 60);

    expect(await getCache(key)).toEqual(value);
  });
});
