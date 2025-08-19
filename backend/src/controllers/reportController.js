import { sequelize } from "../config.js";
import { parseError } from "./userController.js";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import nodemailer from "nodemailer";
import { leaveTypes } from "../validators/leaveValidations.js";
import { EMAIL_PASS, EMAIL_USER } from "../config.js";

const transporter = nodemailer.createTransport({
  service: "gmail", // Or use custom SMTP config
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const leaveTypeKeys = Object.keys(leaveTypes); // ['casual', 'medical', ...]

const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const uniqueAcronyms = [
  ...new Set(Object.values(leaveTypes).map((type) => type.acronym)),
];

async function getSummary(filters) {
  const user_id = filters.user_id || null;
  const dept = filters.dept || null;
  const from = filters.from || null;
  const to = filters.to || null;
  const leaveType = filters.leaveType || null;
  const orderBy = filters.orderBy || "user_id";

  const result = await sequelize.query(
    `SELECT get_dynamic_leave_summary(
          :user_id, :dept, :from_date, :to_date, :leaveType, :orderBy
       ) AS data`,
    {
      replacements: {
        user_id,
        dept,
        from_date: from,
        to_date: to,
        leaveType,
        orderBy,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  console.log(result[0].data);
  return result[0].data;
}

async function getHistory(filters) {
  const user_id = filters.user_id || null;
  const dept = filters.dept || null;
  const from = filters.from || null;
  const to = filters.to || null;
  const leaveType = filters.leaveType || null;
  const orderBy = filters.orderBy || "user_id";

  const result = await sequelize.query(
    `SELECT get_leave_history_json(:user_ids, :dept, :from, :to, :leave_type) AS history`,
    {
      replacements: {
        user_ids: null, // or null
        dept: null,
        from: null,
        to: null,
        leave_type: null,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  console.log(result[0].history);
  return result[0]?.history || [];
}

async function generateCSV(data) {
  const columns = [
    { key: "user_id", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "dept", label: "Department" },
    ...Object.entries(leaveTypes).map(([key, value]) => ({
      key,
      label: value.acronym,
    })),
  ];

  const records = data.map((row) => {
    const formattedRow = {};
    columns.forEach(({ key }) => {
      formattedRow[key] =
        row[key] !== null && row[key] !== undefined ? row[key] : 0;
    });
    return formattedRow;
  });

  const output = stringify(records, {
    header: true,
    columns: columns.map((col) => ({ key: col.key, header: col.label })),
  });

  return Buffer.from(output);
}

async function generateExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Leave Summary");

  if (data.length === 0) return await workbook.xlsx.writeBuffer();

  // Step 1: Define columns
  const columns = [
    { key: "user_id", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "dept", label: "Department" },
    ...Object.entries(leaveTypes).map(([key, value]) => ({
      key,
      label: value.acronym,
    })),
  ];

  worksheet.columns = columns.map((col) => ({
    header: col.label,
    key: col.key,
    width: col.label.length + 2, // initial guess
  }));

  // Step 2: Add rows
  data.forEach((row) => {
    const rowData = {};
    columns.forEach((col) => {
      rowData[col.key] =
        row[col.key] !== null && row[col.key] !== undefined ? row[col.key] : 0;
    });
    worksheet.addRow(rowData);
  });

  // Step 3: Adjust column widths based on content
  worksheet.columns.forEach((column) => {
    let maxLength = column.header.length;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = String(cell.value ?? "");
      if (cellValue.length > maxLength) maxLength = cellValue.length;
    });
    column.width = maxLength + 2;
  });

  // Save to file
  return await workbook.xlsx.writeBuffer();
}

async function generatePDF(data) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 10;
  const margin = 40;
  const rowHeight = 20;
  const colPadding = 5;

  // Define column keys (data keys) and corresponding headers
  const staticColumns = [
    { key: "user_id", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "dept", label: "Dept" },
  ];
  const leaveColumns = leaveTypeKeys.map((key) => ({
    key,
    label: leaveTypes[key].acronym,
  }));

  const columns = [...staticColumns, ...leaveColumns];
  const colWidth = (595.28 - 2 * margin) / columns.length; // A4 width

  let page = pdfDoc.addPage();
  const { height } = page.getSize();
  let y = height - margin;

  // Helper to measure text width
  const getTextWidth = (text) => font.widthOfTextAtSize(String(text), fontSize);

  // Step 1: Measure max width for each column
  const colWidths = columns.map((col) => {
    const headerWidth = getTextWidth(col.label);
    const dataWidth = Math.max(
      ...data.map((row) =>
        getTextWidth(
          row[col.key] !== null && row[col.key] !== undefined
            ? row[col.key]
            : "0"
        )
      )
    );
    return Math.max(headerWidth, dataWidth) + colPadding * 2; // padding
  });

  // Step 2: Total width and left offset
  const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const pageWidth = 595.28; // A4
  const tableStartX = Math.max(margin, (pageWidth - totalTableWidth) / 2);

  const drawRow = (row, isHeader = false) => {
    let x = tableStartX;
    columns.forEach((col, i) => {
      const value = isHeader
        ? col.label
        : row[col.key] !== null && row[col.key] !== undefined
        ? String(row[col.key])
        : "0";

      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidths[i],
        height: rowHeight,
        borderWidth: 0.5,
        borderColor: rgb(0, 0, 0),
      });

      page.drawText(value, {
        x: x + colPadding,
        y: y - rowHeight + colPadding,
        size: fontSize,
        font,
      });

      x += colWidths[i];
    });
  };

  // Header row
  drawRow(null, true);
  y -= rowHeight;

  for (const row of data) {
    if (y - rowHeight < margin) {
      page = pdfDoc.addPage();
      y = height - margin;
      drawRow(null, true); // repeat header
      y -= rowHeight;
    }

    drawRow(row);
    y -= rowHeight;
  }

  return await pdfDoc.save();
}

async function generateHistoryCSV(data) {
  const rows = [];

  for (const user of data) {
    for (const leave of user.leaves) {
      rows.push([
        user.user_id,
        user.name,
        formatDate(leave.appliedOn),
        formatDate(leave.fromDate),
        formatDate(leave.toDate),
        leave.leaveType,
        leave.totalDays,
        leave.dept,
      ]);
    }
  }

  const headers = [
    "User ID",
    "Name",
    "Applied On",
    "From",
    "To",
    "Leave Type",
    "Days",
    "Dept",
  ];

  const csv = stringify(rows, {
    header: true,
    columns: headers,
  });

  return Buffer.from(csv);
}

async function generateHistoryExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Leave History");

  const rows = [];

  for (const user of data) {
    for (const leave of user.leaves) {
      rows.push({
        user_id: user.user_id,
        name: user.name,
        dept: leave.dept,
        appliedOn: formatDate(leave.appliedOn),
        fromDate: formatDate(leave.fromDate),
        toDate: formatDate(leave.toDate),
        leaveType: leave.leaveType,
        totalDays: leave.totalDays,
      });
    }
  }

  if (rows.length === 0) {
    worksheet.addRow(["No data available"]);
  } else {
    const headerMap = {
      user_id: "User ID",
      name: "Name",
      dept: "Dept",
      appliedOn: "Applied On",
      fromDate: "From Date",
      toDate: "To Date",
      leaveType: "Leave Type",
      totalDays: "Total Days",
    };

    const columns = Object.keys(rows[0]).map((key) => ({
      header: headerMap[key] || key,
      key,
      width:
        Math.max(
          headerMap[key]?.length || key.length,
          ...rows.map((row) =>
            Array.from(String(row[key] ?? "")).length
          )
        ) + 2,
    }));

    worksheet.columns = columns;
    worksheet.addRows(rows);
  }

  return await workbook.xlsx.writeBuffer();
}

async function generateHistoryPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 10;
  const margin = 40;
  const rowHeight = 20;
  const colPadding = 5;

  const headers = [
    "User ID",
    "Name",
    "Dept",
    "Applied On",
    "From",
    "To",
    "Leave Type",
    "Days",
  ];

  // Flatten rows
  const rows = [];
  for (const user of data) {
    for (const leave of user.leaves) {
      rows.push([
        user.user_id,
        user.name,
        leave.dept,
        formatDate(leave.appliedOn),
        formatDate(leave.fromDate),
        formatDate(leave.toDate),
        leave.leaveType,
        leave.totalDays,
      ]);
    }
  }

  // Helper to measure text width
  const getTextWidth = (text) => font.widthOfTextAtSize(String(text), fontSize);

  // Measure column widths
  const colWidths = headers.map((header, i) => {
    const headerWidth = getTextWidth(header);
    const dataWidth = Math.max(...rows.map((row) => getTextWidth(row[i])));
    return Math.max(headerWidth, dataWidth) + colPadding * 2;
  });

  const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const pageWidth = 595.28; // A4 portrait width in points
  const tableStartX = Math.max(margin, (pageWidth - totalTableWidth) / 2);

  let page = pdfDoc.addPage();
  const { height: pageHeight } = page.getSize();
  let y = pageHeight - margin;

  const drawRow = (row, isHeader = false) => {
    let x = tableStartX;
    row.forEach((cell, i) => {
      const value = isHeader ? cell : cell ?? "";

      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidths[i],
        height: rowHeight,
        borderWidth: 0.5,
        borderColor: rgb(0, 0, 0),
      });

      page.drawText(String(value), {
        x: x + colPadding,
        y: y - rowHeight + colPadding,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      x += colWidths[i];
    });
  };

  // Draw headers
  drawRow(headers, true);
  y -= rowHeight;

  for (const row of rows) {
    if (y - rowHeight < margin) {
      page = pdfDoc.addPage();
      y = pageHeight - margin;
      drawRow(headers, true); // repeat header
      y -= rowHeight;
    }
    drawRow(row);
    y -= rowHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export const getReport = async (req, res) => {
  try {
    const { filters } = req.body;

    const result = getSummary(filters);

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(400).send(parseError(err));
  }
};

export const downloadReport = async (req, res) => {
  const format = req.body.format;
  const filters = req.body.filters;

  try {
    const jsonData = await getSummary(filters);
    console.log(jsonData);

    if (format === "csv") {
      const csv = generateCSV(jsonData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=report.csv");
      return res.send(csv);
    }

    if (format === "excel") {
      const buffer = await generateExcel(jsonData);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
      return res.send(buffer);
    }

    if (format === "pdf") {
      const pdfBuffer = await generatePDF(jsonData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
      return res.send(pdfBuffer);
    }

    return res.status(400).send("Invalid format");
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Error generating report");
  }
};

export const sendMail = async (req, res) => {
  try {
    const { email, filters } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Step 1: Get data from your dynamic function
    const summaryData = await getSummary(filters); // returns JSON

    // Step 2: Generate all reports
    const pdfBuffer = await generatePDF(summaryData);
    const excelBuffer = await generateExcel(summaryData);
    const csvBuffer = await generateCSV(summaryData);

    // Step 3: Send email with attachments
    const info = transporter.sendMail({
      from: `"Leave Reports" <${EMAIL_USER}>`,
      to: email,
      subject: "Leave Summary Reports",
      text: "Attached are the leave summary reports in PDF, Excel, and CSV formats.",
      attachments: [
        {
          filename: "leave-summary.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
        {
          filename: "leave-summary.xlsx",
          content: excelBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        {
          filename: "leave-summary.csv",
          content: csvBuffer,
          contentType: "text/csv",
        },
      ],
    });

    console.log("Email sent: " + info.messageId);
    res
      .status(200)
      .json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "Failed to send email.", details: error.message });
  }
};

export const getLeaveHistory = async (req, res) => {
  const filters = req.body.filters;

  try {
    const data = await getHistory(filters);
    return res.status(200).send(data);
  } catch (error) {
    return res.status(400).send(parseError(error));
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
    console.error("Download error:", err);
    res.status(500).send("Error generating report");
  }
};

export const sendHistoryMail = async (req,res) => {
  try {
    const { email, filters } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Step 1: Get data from your dynamic function
    const summaryData = await getHistory(filters); // returns JSON

    // Step 2: Generate all reports
    const pdfBuffer = await generateHistoryPDF(summaryData);
    const excelBuffer = await generateHistoryExcel(summaryData);
    const csvBuffer = await generateHistoryCSV(summaryData);

    // Step 3: Send email with attachments
    const info = transporter.sendMail({
      from: `"Leave History Reports" <${EMAIL_USER}>`,
      to: email,
      subject: "Leave History Reports",
      text: "Attached are the leave history reports in PDF, Excel, and CSV formats.",
      attachments: [
        {
          filename: "Leave-History.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
        {
          filename: "Leave-History.xlsx",
          content: excelBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        {
          filename: "Leave-History.csv",
          content: csvBuffer,
          contentType: "text/csv",
        },
      ],
    });

    console.log("Email sent: " + info.messageId);
    res
      .status(200)
      .json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "Failed to send email.", details: error.message });
  }
}

export const saveToDrive = async (req,res) => {
  
}