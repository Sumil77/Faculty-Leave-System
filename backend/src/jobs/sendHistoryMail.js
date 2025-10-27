import { generateAndSendHistoryReport } from "../services/reportService.js";
import { logJobError } from "../utils/jobLogger.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 seconds initial delay

process.on("message", async (data) => {
  const { email, filters } = data;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      await generateAndSendHistoryReport(email, filters);

      if (process.send)
        process.send({
          success: true,
          message: `History mail sent to ${email}`,
        });
      return;
    } catch (err) {
      attempts++;
      await logJobError({ email, filters }, err, attempts);

      if (attempts >= MAX_RETRIES) {
        if (process.send)
          process.send({
            success: false,
            message: `Failed to send history mail to ${email} after ${MAX_RETRIES} attempts`,
            error: err.message,
          });
        return;
      }

      const delay = BASE_DELAY_MS * attempts;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
});
