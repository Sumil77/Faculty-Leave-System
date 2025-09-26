import { parentPort, workerData } from "worker_threads";
import path from "path";
import fs from "fs";
import {
  generateCSV,
  generateExcel,
  generatePDF,
  generateHistoryExcel,
  generateHistoryCSV,
  generateHistoryPDF,
  getSummaryForMail,
  getHistoryForMail,
} from "../services/reportService.js";

const formatMap = { csv: "csv", excel: "xlsx", pdf: "pdf" };

(async () => {
  try {
    const { jobId, filters, format, type } = workerData;
    const outputDir = path.join(process.cwd(), "tmp", "reports");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const data =
      type === "summary"
        ? await getSummaryForMail(filters)
        : await getHistoryForMail(filters);

    let buffer;
    if (type === "summary") {
      if (format === "csv") buffer = await generateCSV(data);
      if (format === "excel") buffer = await generateExcel(data);
      if (format === "pdf") buffer = await generatePDF(data);
    } else {
        console.log("elseeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        
      if (format === "csv") buffer = await generateHistoryCSV(data);
      if (format === "excel") buffer = await generateHistoryExcel(data);
      if (format === "pdf") buffer = await generateHistoryPDF(data);
    }

    const ext = formatMap[format] || format;
    const filePath = path.join(outputDir, `${jobId}.${ext}`);
    fs.writeFileSync(filePath, buffer);

    parentPort.postMessage({ success: true });
  } catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
  }
})();
