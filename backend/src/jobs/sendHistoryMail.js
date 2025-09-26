import { parentPort, workerData } from "worker_threads";
import { generateAndSendHistoryReport } from "../services/reportService.js";
import { logJobError } from "../utils/jobLogger.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 seconds initial delay

const runJob = async () => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      await generateAndSendHistoryReport(workerData.email, workerData.filters);
      parentPort.postMessage(`History mail sent to ${workerData.email}`);
      return;
    } catch (err) {
      attempts++;
      await logJobError(workerData, err, attempts);

      if (attempts >= MAX_RETRIES) {
        parentPort.postMessage(
          `Failed to send history mail to ${workerData.email} after ${MAX_RETRIES} attempts`
        );
        return;
      }

      // add delay before retry (exponential backoff)
      const delay = BASE_DELAY_MS * attempts;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

runJob();
