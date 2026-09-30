import { paymentWorker } from "./workers/payment.worker";
import { adminWorker } from "./workers/admin.worker";

paymentWorker.on("completed", (job) => {
  console.log(`Job payment ${job.id} completed`);
});

paymentWorker.on("failed", (job, error) => {
  console.error(`Job payment ${job?.id} failed:`, error?.message);
});

adminWorker.on("completed", (job) => {
  console.log(`Job admin ${job.id} completed`);
});

adminWorker.on("failed", (job, error) => {
  console.error(`Job admin ${job?.id} failed:`, error?.message);
});

const shutdown = async () => {
  await paymentWorker.close();
  await adminWorker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
