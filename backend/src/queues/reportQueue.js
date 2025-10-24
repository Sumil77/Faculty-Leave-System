import redis from "../redis.js";
import path from "path";
import { fork } from "child_process";

const queueName = "reportQueue";
import bullmq from "bullmq";
const { Queue, Worker, JobScheduler } = bullmq;

new JobScheduler(queueName, { connection: redis });

// Create the queue
const reportQueue = new Queue(queueName, { connection: redis });

// Worker to process jobs
const worker = new Worker(
  queueName,
  async (job) => {
    const jobPathMap = {
      downloadReport: path.join("src", "jobs", "downloadReport.js"),
      sendHistoryMail: path.join("src", "jobs", "sendHistoryMail.js"),
      sendReportMail: path.join("src", "jobs", "sendReportMail.js"),
    };

    const jobFile = jobPathMap[job.name];
    if (!jobFile) throw new Error(`No job file for ${job.name}`);

    return new Promise((resolve, reject) => {
      const child = fork(path.join(process.cwd(), jobFile));

      // Send job data
      child.send(job.data);

      child.on("message", (msg) => {
        if (msg.success === false) reject(new Error(msg.error));
        else resolve(msg);
      });

      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${job.name} exited with code ${code}`));
      });
    });
  },
  { connection: redis, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`Job completed: ${job.name}`));
worker.on("failed", (job, err) =>
  console.error(`Job failed: ${job.name} -> ${err.message}`)
);

export { reportQueue };
