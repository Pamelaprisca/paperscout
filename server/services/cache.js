import { createClient } from "redis";

const memoryCache = new Map();

const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

if (redisClient) {
  redisClient.on("error", (error) => {
    console.warn(`Redis error: ${error.message}`);
  });
  redisClient.connect().catch((error) => {
    console.warn(`Redis connection failed: ${error.message}`);
  });
}

function readMemory(key) {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (item.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return item.value;
}

function writeMemory(key, value, ttlSeconds) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function getCache(key) {
  if (redisClient?.isReady) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  return readMemory(key);
}

export async function setCache(key, value, ttlSeconds = 300) {
  if (redisClient?.isReady) {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
    return;
  }

  writeMemory(key, value, ttlSeconds);
}

export function getCacheMode() {
  if (!redisClient) return "memory";
  return redisClient.isReady ? "redis" : "memory-fallback";
}
