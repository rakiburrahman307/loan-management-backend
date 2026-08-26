import { getRedisClient, isRedisReady } from '../../DB/redis';
import { errorLogger, logger } from '../../shared/logger';
import colors from 'colors';

const isRedisAvailable = async (): Promise<boolean> => {
     if (!isRedisReady()) {
          errorLogger.error(colors.red('Redis is not ready.'));
          return false;
     }
     return true;
};

const serialize = (value: any): string => JSON.stringify(value);
const deserialize = <T>(value: string): T => JSON.parse(value) as T;

const setCache = async (
     key: string,
     value: any,
     expirationInSeconds: number = 3600,
): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          const serializedValue = serialize(value);
          await getRedisClient()!.setEx(key, expirationInSeconds, serializedValue);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis SET error for key "${key}":`), error);
          return false;
     }
};

const getCache = async <T>(key: string): Promise<T | null> => {
     if (!(await isRedisAvailable())) return null;
     try {
          const value = await getRedisClient()!.get(key);
          if (!value) return null;
          return deserialize(value);
     } catch (error) {
          errorLogger.error(colors.red(`Redis GET error for key "${key}":`), error);
          return null;
     }
};

const deleteCache = async (key: string): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.del(key);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis DEL error for key "${key}":`), error);
          return false;
     }
};

const deleteCachePattern = async (pattern: string): Promise<number> => {
     if (!(await isRedisAvailable())) return 0;
     try {
          const keys = await getRedisClient()!.keys(pattern);
          if (keys.length === 0) return 0;
          await getRedisClient()!.del(keys);
          return keys.length;
     } catch (error) {
          errorLogger.error(colors.red(`Redis DEL pattern error for "${pattern}":`), error);
          return 0;
     }
};

const existsCache = async (key: string): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          const exists = await getRedisClient()!.exists(key);
          return exists === 1;
     } catch (error) {
          errorLogger.error(colors.red(`Redis EXISTS error for key "${key}":`), error);
          return false;
     }
};

const expireCache = async (key: string, seconds: number): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.expire(key, seconds);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis EXPIRE error for key "${key}":`), error);
          return false;
     }
};

const incrementCache = async (key: string, amount: number = 1): Promise<number | null> => {
     if (!(await isRedisAvailable())) return null;
     try {
          const value = await getRedisClient()!.incrBy(key, amount);
          return value;
     } catch (error) {
          errorLogger.error(colors.red(`Redis INCR error for key "${key}":`), error);
          return null;
     }
};

const getTTL = async (key: string): Promise<number | null> => {
     if (!(await isRedisAvailable())) return null;
     try {
          const ttl = await getRedisClient()!.ttl(key);
          return ttl;
     } catch (error) {
          errorLogger.error(colors.red(`Redis TTL error for key "${key}":`), error);
          return null;
     }
};

const flushAllCache = async (): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.flushAll();
          logger.warn(colors.yellow('⚠️  All Redis cache cleared!'));
          return true;
     } catch (error) {
          errorLogger.error(colors.red('Redis FLUSHALL error:'), error);
          return false;
     }
};

// ── NEW: Set operations for index-based cache tracking ──────────────────────

// Add one or more members to a Redis Set
const saddCache = async (key: string, ...members: string[]): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     try {
          await getRedisClient()!.sAdd(key, members);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis SADD error for key "${key}":`), error);
          return false;
     }
};

// Return all members of a Redis Set
const smembersCache = async (key: string): Promise<string[]> => {
     if (!(await isRedisAvailable())) return [];
     try {
          return await getRedisClient()!.sMembers(key);
     } catch (error) {
          errorLogger.error(colors.red(`Redis SMEMBERS error for key "${key}":`), error);
          return [];
     }
};

// Delete multiple keys in one round-trip
const delMultiple = async (keys: string[]): Promise<boolean> => {
     if (!(await isRedisAvailable())) return false;
     if (keys.length === 0) return true;
     try {
          await getRedisClient()!.del(keys);
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Redis DEL multiple error:`), error);
          return false;
     }
};

export const RedisCacheHelper = {
     setCache,
     getCache,
     deleteCache,
     deleteCachePattern,
     existsCache,
     expireCache,
     incrementCache,
     getTTL,
     flushAllCache,
     // new
     saddCache,
     smembersCache,
     delMultiple,
};
