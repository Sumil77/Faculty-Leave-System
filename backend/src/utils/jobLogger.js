import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "jobErrors.log");

export const logJobError = async (jobData, error, attempt) => {
  const log = `[${new Date().toISOString()}] Job: ${jobData.email} Attempt: ${attempt} Error: ${error.message}\n`;
  fs.appendFileSync(logFile, log);
};