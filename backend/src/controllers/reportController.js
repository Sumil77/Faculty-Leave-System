import { sequelize } from "../config.js";
import { Op, QueryTypes } from "sequelize";
import { parseError } from "./userController.js";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { leaveTypes } from "../validators/leaveValidations.js";
import { EMAIL_USER } from "../config.js";
import bree from "../breeInstance.js";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import { getSummary, getHistory } from "../services/reportService.js";
import {
  User,
  LeaveApproved,
  LeaveRejected,
  LeavePending,
  CompensatoryLeave,
} from "../models/index.js";
import { reportQueue } from "../queues/reportQueue.js"; // BullMQ queue

const leaveTypeKeys = Object.keys(leaveTypes); // ['casual', 'medical', ...]

const uniqueAcronyms = [
  ...new Set(Object.values(leaveTypes).map((type) => type.acronym)),
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getReportSummary = async (req, res) => {
  try {
    // ----------------------
    // 1️⃣ Fetch all active users
    // ----------------------
    const users = await User.findAll({
      attributes: ["user_id", "name", "dept", "desig"],
    });

    // ----------------------
    // 2️⃣ Aggregate leaves per user
    // ----------------------
    // Get leave counts grouped by user_id
    const approvedCounts = await LeaveApproved.findAll({
      attributes: ["user_id", [sequelize.fn("COUNT", "user_id"), "count"]],
      group: ["user_id"],
      raw: true,
    });

    const rejectedCounts = await LeaveRejected.findAll({
      attributes: ["user_id", [sequelize.fn("COUNT", "user_id"), "count"]],
      group: ["user_id"],
      raw: true,
    });

    const pendingCounts = await LeavePending.findAll({
      attributes: ["user_id", [sequelize.fn("COUNT", "user_id"), "count"]],
      group: ["user_id"],
      raw: true,
    });

    // Convert counts to maps for fast lookup
    const approvedMap = Object.fromEntries(
      approvedCounts.map((r) => [r.user_id, parseInt(r.count)])
    );
    const rejectedMap = Object.fromEntries(
      rejectedCounts.map((r) => [r.user_id, parseInt(r.count)])
    );
    const pendingMap = Object.fromEntries(
      pendingCounts.map((r) => [r.user_id, parseInt(r.count)])
    );

    // ----------------------
    // 3️⃣ Department-wise aggregation
    // ----------------------
    const deptMap = {};

    users.forEach((user) => {
      const dept = user.dept || "Unknown";

      const approved = approvedMap[user.user_id] || 0;
      const rejected = rejectedMap[user.user_id] || 0;
      const pending = pendingMap[user.user_id] || 0;
      const total = approved + rejected + pending;

      if (!deptMap[dept]) {
        deptMap[dept] = {
          name: dept,
          leaves: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        };
      }

      deptMap[dept].leaves += total;
      deptMap[dept].approved += approved;
      deptMap[dept].rejected += rejected;
      deptMap[dept].pending += pending;
    });

    const deptReports = Object.values(deptMap);

    // ----------------------
    // 4️⃣ Overall stats
    // ----------------------
    const totalLeaves = deptReports.reduce((acc, d) => acc + d.leaves, 0);
    const totalPending = deptReports.reduce((acc, d) => acc + d.pending, 0);
    const totalApproved = deptReports.reduce((acc, d) => acc + d.approved, 0);
    const approvedPercent = totalLeaves
      ? Math.round((totalApproved / totalLeaves) * 100)
      : 0;

    const topDept = deptReports.length
      ? deptReports.reduce((max, dept) =>
          dept.leaves > max.leaves ? dept : max
        ).name
      : "-";

    // ----------------------
    // 5️⃣ Respond
    // ----------------------
    res.json({
      stats: {
        totalLeaves,
        pending: totalPending,
        approvedPercent,
        topDept,
      },
      deptReports,
    });
  } catch (error) {
    console.error("Error fetching report summary:", error);
    res.status(500).json({ message: "Failed to fetch report summary" });
  }
};

export const getLeaveSummary = async (req, res) => {
  try {
    const {
      user_id,
      dept,
      from,
      to,
      leave_type,
      order_by = "user_id",
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;

    const result = await sequelize.query(
      `SELECT get_dynamic_leave_summary(
        :user_id, :dept, :from, :to, :leave_type, :order_by, :limit, :offset
      ) AS data`,
      {
        replacements: {
          user_id: user_id ? Number(user_id) : null,
          dept: dept || null,
          from: from || null,
          to: to || null,
          leave_type: leave_type || null,
          order_by,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      }
    );

    // DB function now returns { totalCount, rows }
    const { totalCount = 0, rows = [] } = result[0].data || {};
    console.log(rows);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching leave summary:", error);
    res.status(500).json({ message: "Failed to fetch leave summary" });
  }
};

export const getLeaveHistory = async (req, res) => {
  try {
    const {
      user_ids, // comma-separated
      dept,
      from,
      to,
      leave_type,
      order_by = "user_id",
      page = 1,
      limit = 20,
    } = req.query;

    const ids = user_ids ? user_ids.split(",").map(Number) : null;
    const offset = (page - 1) * limit;

    const result = await sequelize.query(
      `SELECT get_leave_history_json(
        :user_ids, :dept, :from, :to, :leave_type, :order_by, :limit, :offset
      ) AS data`,
      {
        replacements: {
          user_ids: ids,
          dept: dept || null,
          from: from || null,
          to: to || null,
          leave_type: leave_type || null,
          order_by,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      }
    );

    const { totalCount = 0, rows = [] } = result[0].data || {};
    console.log(rows);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching leave history:", error);
    res.status(500).json({ message: "Failed to fetch leave history" });
  }
};

const formatMap = {
  csv: "csv",
  pdf: "pdf",
  excel: "xlsx",
};

export const requestDownload = async (req, res) => {
  try {
    const { format, type, ...filters } = req.query;
    if (!format || !type)
      return res.status(400).json({ error: "Format and type are required" });

    // Unique job name
    const jobName = `download-${uuidv4()}`;
    const jobPath = path.join(__dirname, "../jobs/downloadReport.js");

    // Add job to Bree
    await reportQueue.add("downloadReport", {
      jobId: jobName,
      filters,
      format,
      type,
    });

    res.json({ success: true, jobId: jobName });
  } catch (err) {
    console.error("Failed to queue download job:", err);
    res.status(500).json({ error: "Failed to queue download job." });
  }
};

export const checkDownload = (req, res) => {
  const { jobId } = req.params;
  const { format } = req.query;
  const ext = format === "excel" ? "xlsx" : format;
  const filePath = path.join(
    process.cwd(),
    "tmp",
    "reports",
    `${jobId}.${ext}`
  );

  res.json({ ready: fs.existsSync(filePath) });
};

export const serveDownload = (req, res) => {
  const { jobId, format } = req.params;
  const ext = format === "excel" ? "xlsx" : format;
  const filePath = path.join(
    process.cwd(),
    "tmp",
    "reports",
    `${jobId}.${ext}`
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Explicit MIME types
  const mimeTypes = {
    csv: "text/csv",
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="report.${ext}"`);

  // Stream instead of res.download (more reliable for fetch/blob)
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};

export const sendMail = async (req, res) => {
  try {
    const { email, filters } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate a unique job name
    const jobName = `sendReportMail-${uuidv4()}`;
    const jobPath = path.join(__dirname, "../jobs/sendReportMail.js");

    // Add job to Bree
    await reportQueue.add("sendReportMail", { jobId: jobName, email, filters });

    res.json({ success: true, message: `Report job queued for ${email}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to queue report job." });
  }
};

export const downloadHistory = async (req, res) => {
  const format = req.body.format;
  const filters = req.body.filters;

  try {
    const jsonData = await getHistory(filters);
    console.log(jsonData);

    if (format === "csv") {
      const csv = generateHistoryCSV(jsonData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=report.csv");
      return res.send(csv);
    }

    if (format === "excel") {
      const buffer = await generateHistoryExcel(jsonData);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
      return res.send(buffer);
    }

    if (format === "pdf") {
      const pdfBuffer = await generateHistoryPDF(jsonData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
      return res.send(pdfBuffer);
    }
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("Error generating report");
  }
};

export const sendHistoryMail = async (req, res) => {
  try {
    const { email, filters } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const jobName = `historyMail-${uuidv4()}`;
    const jobPath = path.join(__dirname, "../jobs/sendHistoryMail.js");

    await reportQueue.add("sendHistoryMail", {
      jobId: jobName,
      email,
      filters,
    });

    res.json({
      success: true,
      message: `History mail job queued for ${email}.`,
      jobId: jobName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to queue history mail job." });
  }
};

export const saveToDrive = async (req, res) => {};
