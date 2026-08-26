import config from '../../config';
import { RedisCacheHelper } from '../../helpers/redis/redisHelper';
import { logger } from '../../shared/logger';
import crypto from 'crypto';

export const CACHE_TTL = {
     SHORT: 300, // 5 minutes
     MEDIUM: 600, // 10 minutes
     LONG: 1800, // 30 minutes
     VERY_LONG: 3600, // 1 hour
};

const CACHE_VERSION = 'v1';

class RedisCacheBuilder {
     private entityName: string;

     constructor(entityName: string) {
          this.entityName = entityName.toLowerCase();
     }

     // ─────────────────────────────────────────────
     // KEY GENERATORS
     // ─────────────────────────────────────────────

     // Normalize + hash → same query always gives same short key
     private getListKey(query: Record<string, unknown>): string {
          const normalized = Object.keys(query)
               .sort()
               .reduce((acc, key) => ({ ...acc, [key]: query[key] }), {});

          if (config.node_env === 'development') {
               return `${CACHE_VERSION}:${this.entityName}:list:${JSON.stringify(normalized)}`;
          }

          const hash = crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
          return `${CACHE_VERSION}:${this.entityName}:list:${hash}`;
     }

     private getSingleKey(id: string): string {
          return `${CACHE_VERSION}:${this.entityName}:${id}`;
     }

     private getCustomKey(suffix: string): string {
          return `${CACHE_VERSION}:${this.entityName}:${suffix}`;
     }

     // Tracks all list cache keys for this entity (Redis Set)
     private getListIndexKey(): string {
          return `${CACHE_VERSION}:${this.entityName}:list:_index`;
     }

     // ─────────────────────────────────────────────
     // WRAP HELPERS
     // ─────────────────────────────────────────────

     async wrapList<T>(
          query: Record<string, unknown>,
          originalFunction: () => Promise<T>,
          ttl: number = CACHE_TTL.SHORT,
     ): Promise<T> {
          const cacheKey = this.getListKey(query);

          const cached = await RedisCacheHelper.getCache<T>(cacheKey);
          if (cached) {
               logger.info(`✅ Cache HIT: ${cacheKey}`);
               return cached;
          }

          logger.info(`❌ Cache MISS: ${cacheKey} - Fetching from DB`);
          const result = await originalFunction();

          const setSuccess = await RedisCacheHelper.setCache(cacheKey, result, ttl);
          if (!setSuccess) {
               logger.error(`Failed to cache data for key: ${cacheKey}`);
          } else {
               // Register key in index set — no pattern scan needed on delete
               await RedisCacheHelper.saddCache(this.getListIndexKey(), cacheKey);
               await RedisCacheHelper.expireCache(this.getListIndexKey(), ttl);
               logger.info(`💾 Cached & indexed: ${cacheKey}`);
          }

          return result;
     }

     async wrapSingle<T>(
          id: string,
          originalFunction: () => Promise<T>,
          ttl: number = CACHE_TTL.MEDIUM,
     ): Promise<T> {
          const cacheKey = this.getSingleKey(id);

          const cached = await RedisCacheHelper.getCache<T>(cacheKey);
          if (cached) {
               logger.info(`✅ Cache HIT: ${cacheKey}`);
               return cached;
          }

          logger.info(`❌ Cache MISS: ${cacheKey} - Fetching from DB`);
          const result = await originalFunction();

          const setSuccess = await RedisCacheHelper.setCache(cacheKey, result, ttl);
          if (!setSuccess) {
               logger.error(`Failed to cache data for key: ${cacheKey}`);
          } else {
               logger.info(`💾 Cached: ${cacheKey}`);
          }

          return result;
     }

     async wrapCustom<T>(
          suffix: string,
          originalFunction: () => Promise<T>,
          ttl: number = CACHE_TTL.MEDIUM,
     ): Promise<T> {
          const cacheKey = this.getCustomKey(suffix);

          const cached = await RedisCacheHelper.getCache<T>(cacheKey);
          if (cached) {
               logger.info(`✅ Cache HIT: ${cacheKey}`);
               return cached;
          }

          logger.info(`❌ Cache MISS: ${cacheKey} - Fetching from DB`);
          const result = await originalFunction();

          const setSuccess = await RedisCacheHelper.setCache(cacheKey, result, ttl);
          if (!setSuccess) {
               logger.error(`Failed to cache data for key: ${cacheKey}`);
          } else {
               logger.info(`💾 Cached: ${cacheKey}`);
          }

          return result;
     }

     // ─────────────────────────────────────────────
     // CACHE INVALIDATION
     // ─────────────────────────────────────────────

     async clearAfterUpdate(id: string): Promise<void> {
          await RedisCacheHelper.deleteCache(this.getSingleKey(id));
          await this.clearLists();
          logger.info(`🗑️  Cache cleared for ${this.entityName}:${id} and all lists`);
     }

     async clearLists(): Promise<void> {
          const indexKey = this.getListIndexKey();

          // Get all tracked list keys from the index set
          const listKeys = await RedisCacheHelper.smembersCache(indexKey);

          // Delete all list keys in one round-trip
          await RedisCacheHelper.delMultiple(listKeys);

          // Remove the index set itself
          await RedisCacheHelper.deleteCache(indexKey);

          logger.info(`🗑️  List cache cleared for ${this.entityName} (${listKeys.length} keys)`);
     }

     async clearAll(): Promise<void> {
          // Full wipe — pattern delete acceptable here (admin/intentional action, not hot path)
          const deletedCount = await RedisCacheHelper.deleteCachePattern(
               `${CACHE_VERSION}:${this.entityName}*`,
          );
          logger.info(`🗑️  All cache cleared for ${this.entityName} (${deletedCount} keys)`);
     }
}

export const createCacheHelper = (entityName: string) => {
     return new RedisCacheBuilder(entityName);
};
