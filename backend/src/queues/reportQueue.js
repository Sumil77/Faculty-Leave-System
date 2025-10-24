import { Queue, Worker, QueueScheduler } from "bullmq";
import redis from "../redis.js";
import path from "path";
import { fork } from "child_process";

const queueName = "reportQueue";

// QueueScheduler is needed for repeatable jobs and delayed jobs
new QueueScheduler(queueName, { connection: redis });

// Create the queue
const reportQueue = new Queue(queueName, { connection: redis });

// Worker to process jobs
const worker = new Worker(
  queueName,
  async (job) => {
    const jobPathMap = {
      downloadReport: "../jobs/downloadReport.js",
      sendHistoryMail: "../jobs/sendHistoryMail.js",
      sendReportMail: "../jobs/sendReportMail.js",
    };

    const jobFile = jobPathMap[job.name];
    if (!jobFile) throw new Error(`No job file for ${job.name}`);

    // Run the job in a child process similar to Bree
    return new Promise((resolve, reject) => {
      const child = fork(path.join(process.cwd(), "src", jobFile), [], {
        env: { ...process.env, ...job.data },
      });

      child.on("message", (msg) => {
        if (msg.success === false) reject(new Error(msg.error));
      });

      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${job.name} exited with code ${code}`));
      });
    });
  },
  { connection: redis, concurrency: 5 }
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.name}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job failed: ${job.name} -> ${err.message}`);
});

export { reportQueue };
