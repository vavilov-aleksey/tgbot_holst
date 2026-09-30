import Redis from "ioredis";
import { GetEnvKey } from "../features/getEnvKey";

const redisUrl = new GetEnvKey().get("REDIS_URL");

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
});
