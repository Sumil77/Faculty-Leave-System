import path from "path";
import fs from "fs";
import {
  generateCSV,
  generateExcel,
  generatePDF,
  generateHistoryCSV,
  generateHistoryExcel,
  generateHistoryPDF,
  getSummaryForMail,
  getHistoryForMail,
} from "../services/reportService.js";

const formatMap = { csv: "csv", excel: "xlsx", pdf: "pdf" };

process.on("message", async (data) => {
  const { jobId, filters, format, type } = data;

  try {
    const outputDir = path.join(process.cwd(), "tmp", "reports");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const reportData =
      type === "summary"
        ? await getSummaryForMail(filters)
        : await getHistoryForMail(filters);

    let buffer;
    if (type === "summary") {
      if (format === "csv") buffer = await generateCSV(reportData);
      if (format === "excel") buffer = await generateExcel(reportData);
      if (format === "pdf") buffer = await generatePDF(reportData);
    } else {
      if (format === "csv") buffer = await generateHistoryCSV(reportData);
      if (format === "excel") buffer = await generateHistoryExcel(reportData);
      if (format === "pdf") buffer = await generateHistoryPDF(reportData);
    }

    const ext = formatMap[format] || format;
    const filePath = path.join(outputDir, `${jobId}.${ext}`);
    fs.writeFileSync(filePath, buffer);

    if (process.send) process.send({ success: true, filePath });
  } catch (err) {
    if (process.send) process.send({ success: false, error: err.message });
  }
});
