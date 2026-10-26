import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const paymentQueue = new Queue("payment_queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
