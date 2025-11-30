import { transporter, sequelize, EMAIL_USER } from "../config.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import { getLeaveTypes } from "../validators/leaveValidations.js";

const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Utility to safely get cell value
function safeValue(obj, key) {
  return obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : "";
}

export async function getHistory(filters = {}) {
  try {
    const {
      user_ids = null,
      dept = null,
      from = null,
      to = null,
      leave_type_id = null, // updated: integer ID
      orderBy = "user_id",
      limit = 20,
      offset = 0,
    } = filters;

    const result = await sequelize.query(
      `SELECT get_leave_history_json(
         :user_ids::int[],
         :dept::text,
         :from::date,
         :to::date,
         :leave_type_id::int,
         :order_by::text,
         :limit,
         :offset
       ) AS history`,
      {
        replacements: {
          user_ids,
          dept,
          from,
          to,
          leave_type_id,
          order_by: orderBy,
          limit,
          offset,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const history =
      typeof result[0].history === "string"
        ? JSON.parse(result[0].history)
        : result[0].history;

    // return { totalCount, rows }
    return history || { totalCount: 0, rows: [] };
  } catch (err) {
    console.error("Error fetching leave history:", err);
    throw err;
  }
}

export async function getHistoryForMail(filters = {}) {
  try {
    const {
      user_ids = null,
      dept = null,
      from = null,
      to = null,
      leave_type_id = null, // updated to integer ID
      orderBy = "user_id",
    } = filters;

    const MAX_ROWS = 500000; // safe upper bound for reports

    const result = await sequelize.query(
      `SELECT get_leave_history_json(
         :user_ids::int[],
         :dept::text,
         :from::date,
         :to::date,
         :leave_type_id::int,
         :order_by::text,
         :limit,
         :offset
       ) AS history`,
      {
        replacements: {
          user_ids,
          dept,
          from,
          to,
          leave_type_id,
          order_by: orderBy,
          limit: MAX_ROWS,
          offset: 0,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const history =
      typeof result[0].history === "string"
        ? JSON.parse(result[0].history)
        : result[0].history;

    // ✅ return only rows (Excel/CSV/PDF doesn’t need totalCount)
    return history?.rows || [];
  } catch (err) {
    console.error("Error fetching leave history for mail:", err);
    throw err;
  }
}

export async function generateHistoryCSV(data) {
  if (!data || data.length === 0) return Buffer.from("");

  const leaveTypes = await getLeaveTypes(); // same as PDF
  const ltMap = new Map(
    leaveTypes.map((lt) => [lt.name.toLowerCase().trim(), lt.acronym])
  );

  const rows = data.flatMap((user) =>
    (user.leaves || []).map((leave) => {
      const ltKey = (leave.leaveType || "").toLowerCase().trim();
      const acronym = ltMap.get(ltKey) || leave.leaveType || "-";

      return [
        user.user_id,
        user.name,
        user.dept,
        formatDate(leave.appliedOn),
        formatDate(leave.fromDate),
        formatDate(leave.toDate),
        acronym,
        leave.totalDays ?? "-",
      ];
    })
  );

  const headers = [
    "UID",
    "Name",
    "Dept",
    "Applied On",
    "From",
    "To",
    "Leave Type",
    "Days",
  ];

  const csv = stringify(rows, { header: true, columns: headers });
  return Buffer.from(csv);
}

export async function generateHistoryExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Leave History");

  if (!data || data.length === 0) {
    worksheet.addRow(["No data available"]);
    return await workbook.xlsx.writeBuffer();
  }

  const leaveTypes = await getLeaveTypes();
  const ltMap = new Map(
    leaveTypes.map((lt) => [lt.name.toLowerCase().trim(), lt.acronym])
  );

  const rows = data.flatMap((user) =>
    (user.leaves || []).map((leave) => {
      const ltKey = (leave.leaveType || "").toLowerCase().trim();
      const acronym = ltMap.get(ltKey) || leave.leaveType || "-";

      return {
        uid: user.user_id,
        name: user.name,
        dept: user.dept,
        appliedOn: formatDate(leave.appliedOn),
        fromDate: formatDate(leave.fromDate),
        toDate: formatDate(leave.toDate),
        leaveType: acronym,
        totalDays: leave.totalDays ?? "-",
      };
    })
  );

  const columns = [
    { header: "UID", key: "uid", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Dept", key: "dept", width: 10 },
    { header: "Applied On", key: "appliedOn", width: 15 },
    { header: "From", key: "fromDate", width: 15 },
    { header: "To", key: "toDate", width: 15 },
    { header: "Leave Type", key: "leaveType", width: 12 },
    { header: "Days", key: "totalDays", width: 10 },
  ];

  worksheet.columns = columns;

  rows.forEach((row) => worksheet.addRow(row));

  return await workbook.xlsx.writeBuffer();
}

export async function generateHistoryPDF(data = []) {
  const leaveTypes = await getLeaveTypes(); // ✅ array
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margin: 40,
  });

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const endPromise = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const fontSize = 9;
  const rowHeight = 20;
  const padding = 5;

  const headers = [
    "UID",
    "Name",
    "Dept",
    "Applied On",
    "From",
    "To",
    "Leave Type",
    "Days",
  ];

  // ✅ Flatten nested structure and map acronym from leaveTypes array
  const rows = data.flatMap((user) =>
    (user.leaves || []).map((leave) => {
      const ltKey = (leave.leaveType || "").toLowerCase().trim();

      // Find matching leave type object
      const matchedType =
        leaveTypes.find(
          (lt) =>
            lt.name.toLowerCase() === ltKey ||
            lt.acronym.toLowerCase() === ltKey
        )?.acronym ||
        leave.leaveType ||
        "-";

      return [
        user.user_id,
        user.name,
        user.dept,
        formatDate(leave.appliedOn),
        formatDate(leave.fromDate),
        formatDate(leave.toDate),
        matchedType, // ✅ shows acronym (e.g., CL)
        leave.totalDays ?? "-",
      ];
    })
  );

  // Handle empty
  if (!rows.length) {
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("No leave records found.", 100, 100);
    doc.end();
    return await endPromise;
  }

  const measure = (text) => doc.widthOfString(String(text || ""), { fontSize });
  const colWidths = headers.map((header, i) => {
    const headerWidth = measure(header);
    const dataWidth = Math.max(...rows.map((row) => measure(row[i])));
    return Math.min(Math.max(headerWidth, dataWidth) + padding * 2, 100);
  });

  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = Math.max(40, (doc.page.width - tableWidth) / 2);
  let y = doc.y + 40;

  const drawRow = (row, isHeader = false) => {
    let x = startX;
    const height = rowHeight;
    doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);

    row.forEach((cell, i) => {
      let text = String(cell ?? "");
      const width = colWidths[i];

      // Draw border
      doc.rect(x, y, width, height).stroke();

      // ✅ Clip long names (or any long text) to prevent overlapping
      if (i === 1 && measure(text) > width - padding * 2) {
        while (measure(text + "...") > width - padding * 2 && text.length > 0) {
          text = text.slice(0, -1);
        }
        text += "...";
      }

      doc.text(text, x + padding, y + padding, {
        width: width - padding * 2,
        align: "center",
        lineBreak: false,
      });

      x += width;
    });
    y += height;
  };

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Leave History Report", { align: "center" });
  doc.moveDown(1.5);

  drawRow(headers, true);

  for (const row of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
      drawRow(headers, true);
    }
    drawRow(row);
  }

  doc.end();
  return await endPromise;
}

export async function getSummary(filters = {}) {
  try {
    const {
      user_id = null,
      dept = null,
      from = null,
      to = null,
      leave_type_id = null, // updated to integer
      orderBy = "user_id",
      limit = 20,
      offset = 0,
    } = filters;

    const result = await sequelize.query(
      `SELECT get_dynamic_leave_summary(
          :user_id::int,
          :dept::text,
          :from_date::date,
          :to_date::date,
          :leave_type_id::int,
          :order_by::text,
          :limit,
          :offset
       ) AS data`,
      {
        replacements: {
          user_id,
          dept,
          from_date: from,
          to_date: to,
          leave_type_id,
          order_by: orderBy,
          limit,
          offset,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!result || !result[0] || !result[0].data) {
      return { totalCount: 0, rows: [] };
    }

    const summary =
      typeof result[0].data === "string"
        ? JSON.parse(result[0].data)
        : result[0].data;

    // ✅ Paginated API expects { totalCount, rows }
    return summary;
  } catch (err) {
    console.error("Error fetching leave summary:", err);
    throw new Error("Failed to fetch leave summary.");
  }
}

export async function getSummaryForMail(filters = {}) {
  try {
    const {
      user_id = null,
      dept = null,
      from = null,
      to = null,
      leave_type_id = null, // updated to integer
      orderBy = "user_id",
    } = filters;

    const MAX_ROWS = 500000;

    const replacements = {
      user_id: user_id ?? null,
      dept: dept ?? null,
      from_date: from ?? null,
      to_date: to ?? null,
      leave_type_id: leave_type_id ?? null, // updated
      order_by: orderBy ?? "user_id",
      limit: MAX_ROWS,
      offset: 0,
    };

    const result = await sequelize.query(
      `
      SELECT get_dynamic_leave_summary(
        :user_id::int,
        :dept::text,
        :from_date::date,
        :to_date::date,
        :leave_type_id::int,
        :order_by::text,
        :limit,
        :offset
      ) AS data;
      `,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!result?.[0]?.data) {
      return { rows: [], analytics: {}, totalCount: 0 };
    }

    const summary =
      typeof result[0].data === "string"
        ? JSON.parse(result[0].data)
        : result[0].data;

    // 🩵 Ensure numeric totals (optional, if you have numeric columns per leave type)
    if (summary?.rows?.length) {
      summary.rows = summary.rows.map((row) => {
        const newRow = { ...row };
        for (const key in newRow) {
          if (typeof newRow[key] === "number" || !isNaN(Number(newRow[key]))) {
            newRow[key] = parseFloat(Number(newRow[key]).toFixed(2));
          }
        }
        return newRow;
      });
    }

    // 🩵 Return rows + analytics
    return {
      rows: summary?.rows || [],
      analytics: summary?.analytics || {},
      totalCount: summary?.totalCount || 0,
    };
  } catch (err) {
    console.error("❌ Error fetching leave summary for mail:", err);
    throw new Error("Failed to fetch leave summary for mail.");
  }
}

export async function generateCSV(data) {
  try {
    // 🩵 Normalize leave types into a key-value map { acronym: { name, acronym } }
    const rawLeaveTypes = await getLeaveTypes();
    const leaveTypes = Array.isArray(rawLeaveTypes)
      ? Object.fromEntries(rawLeaveTypes.map((t) => [t.acronym, t]))
      : rawLeaveTypes;

    const leaveTypeKeys = Object.keys(leaveTypes);

    data = Array.isArray(data) ? data : data?.rows || [];
    if (!data.length) return Buffer.from("");

    const columns = [
      { key: "user_id", label: "UID" },
      { key: "name", label: "Name" },
      { key: "dept", label: "Dept" },
      ...leaveTypeKeys.map((key) => ({ key, label: leaveTypes[key].acronym })),
    ];

    const records = data.map((row) => {
      const formattedRow = {};
      columns.forEach(({ key }) => (formattedRow[key] = safeValue(row, key)));
      return formattedRow;
    });

    const output = stringify(records, {
      header: true,
      columns: columns.map((col) => ({ key: col.key, header: col.label })),
    });

    return Buffer.from(output);
  } catch (err) {
    console.error("Error generating CSV:", err);
    throw new Error("Failed to generate CSV report.");
  }
}

export async function generateExcel(filters, rawData) {
  const leaveTypes = await getLeaveTypes();
  const leaveTypeList = Object.values(leaveTypes);

  // Extract data and analytics like PDF
  const data = Array.isArray(rawData?.rows) ? rawData.rows : rawData || [];
  const analytics = rawData?.analytics || {};

  if (!data.length) throw new Error("No data available for Excel generation.");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Leave Summary");

  // -----------------------------
  // 1️⃣ Title and timestamp
  // -----------------------------
  let rowIndex = 1;

  worksheet.mergeCells(`A${rowIndex}:Z${rowIndex}`);
  worksheet.getCell(`A${rowIndex}`).value = "Leave Summary Report";
  worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 16 };
  worksheet.getCell(`A${rowIndex}`).alignment = { horizontal: "center" };
  rowIndex++;

  worksheet.mergeCells(`A${rowIndex}:Z${rowIndex}`);
  worksheet.getCell(
    `A${rowIndex}`
  ).value = `Generated on ${new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  })}`;
  worksheet.getCell(`A${rowIndex}`).alignment = { horizontal: "center" };
  rowIndex++;

  worksheet.mergeCells(`A${rowIndex}:Z${rowIndex}`);
  worksheet.getCell(`A${rowIndex}`).value = `Filters applied: Dept = ${
    filters.dept || "All"
  }, Date Range = ${filters.from || "-"} to ${filters.to || "-"}`;
  worksheet.getCell(`A${rowIndex}`).alignment = { horizontal: "center" };
  rowIndex += 2;

  // -----------------------------
  // 2️⃣ Table headers
  // -----------------------------
  const dynamicKeys = Object.keys(data[0]).filter(
    (k) => !["user_id", "name", "dept", "totalDays"].includes(k)
  );

  const headers = [
    { label: "UID", property: "user_id" },
    { label: "Name", property: "name" },
    { label: "Dept.", property: "dept" },
    ...dynamicKeys.map((key) => ({
      label: leaveTypeList.find((lt) => lt.acronym === key)?.acronym || key,
      property: key,
    })),
  ];

  worksheet.addRow(headers.map((h) => h.label));
  rowIndex++;

  // -----------------------------
  // 3️⃣ Table rows
  // -----------------------------
  for (const row of data) {
    const formatted = headers.map((h) => {
      const val = row[h.property];
      if (val === null || val === undefined) return "-";
      if (typeof val === "number") return val.toString();
      return String(val);
    });
    worksheet.addRow(formatted);
    rowIndex++;
  }

  // -----------------------------
  // 4️⃣ Analytics summary
  // -----------------------------
  rowIndex++;
  worksheet.addRow([]);
  worksheet.addRow(["Analytics Summary"]);
  rowIndex++;

  Object.entries(analytics.leavetypetotals || {}).forEach(([type, total]) => {
    worksheet.addRow([`${type}: ${total}`]);
    rowIndex++;
  });

  if (analytics.grandtotal !== undefined) {
    worksheet.addRow([`Grand Total Leaves Taken: ${analytics.grandtotal}`]);
    rowIndex++;
  }

  return await workbook.xlsx.writeBuffer();
}

export async function generatePDF(filters, rawData) {
  try {
    const leaveTypes = await getLeaveTypes();
    const leaveTypeList = Object.values(leaveTypes);

    // ✅ Extract both analytics and data
    const data = Array.isArray(rawData?.rows) ? rawData.rows : rawData || [];
    const analytics = rawData?.analytics || {};

    if (!data.length) throw new Error("No data available for PDF generation.");
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const endPromise = new Promise((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    );

    // ✅ Proper headers using actual data keys
    const dynamicKeys = Object.keys(data[0]).filter(
      (k) => !["user_id", "name", "dept", "totalDays"].includes(k)
    );

    const headers = [
      { label: "UID", property: "user_id" },
      { label: "Name", property: "name" },
      { label: "Dept.", property: "dept" },
      ...dynamicKeys.map((key) => ({
        label: leaveTypeList.find((lt) => lt.acronym === key)?.acronym || key,
        property: key,
      })),
    ];

    // ✅ Format rows properly
    const rows = data.map((row) => {
      const formatted = {};
      for (const h of headers) {
        const val = row[h.property];
        if (val === null || val === undefined) {
          formatted[h.property] = "-";
        } else if (typeof val === "number") {
          formatted[h.property] =
            h.property === "user_id"
              ? parseInt(val).toString()
              : val % 1 === 0
              ? val.toString()
              : val.toFixed(2);
        } else {
          formatted[h.property] = String(val);
        }
      }
      return formatted;
    });

    // 🔠 Font setup
    const fontSize = 9;
    const padding = 6;
    const ctx = doc.font("Helvetica").fontSize(fontSize);
    const measure = (text) => ctx.widthOfString(String(text || ""));

    const colWidths = headers.map((h) => {
      const headerWidth = measure(h.label);
      const dataWidth = Math.max(...rows.map((r) => measure(r[h.property])));
      return Math.min(Math.max(headerWidth, dataWidth) + padding * 2, 120);
    });

    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = Math.max(40, (doc.page.width - tableWidth) / 2);

    // 🧾 Title and timestamp
    doc.font("Helvetica-Bold").fontSize(16).text("Leave Summary Report", {
      align: "center",
    });
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        `Generated on ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`,
        { align: "center" }
      );

    doc.text(
      `Filters applied: Dept = ${filters.dept || "All"}, Date Range = ${
        filters.from || "-"
      } to ${filters.to || "-"}`
    );

    // ✅ Add enough space after title
    let y = doc.y + 30;

    const drawRow = (row, isHeader = false) => {
      let x = startX;
      const rowHeight = 18;

      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica");

      headers.forEach((h, i) => {
        const text = row[h.property] || (isHeader ? h.label : "");
        const width = colWidths[i];

        // Draw border
        doc.rect(x, y, width, rowHeight).stroke();

        // Clip long names instead of overlapping
        let displayText = text;
        if (h.property === "name" && measure(displayText) > width - 8) {
          while (measure(displayText + "...") > width - 8) {
            displayText = displayText.slice(0, -1);
          }
          displayText += "...";
        }

        doc.text(displayText, x + 3, y + 5, {
          width: width - 6,
          align: "center",
          lineBreak: false,
        });

        x += width;
      });

      y += rowHeight;
    };

    // Header row
    drawRow(
      Object.fromEntries(headers.map((h) => [h.property, h.label])),
      true
    );

    // Data rows
    for (const row of rows) {
      if (y > doc.page.height - 60) {
        doc.addPage({ size: "A4", layout: "landscape" });
        y = 40;
        drawRow(
          Object.fromEntries(headers.map((h) => [h.property, h.label])),
          true
        );
      }
      drawRow(row);
    }

    doc.addPage({ size: "A4", layout: "landscape" });
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Analytics Summary", { align: "center" });

    doc.moveDown(1);
    Object.entries(analytics.leavetypetotals).forEach(([type, total]) => {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`${type}: ${total}`, { align: "left" });
    });

    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .text(`Grand Total Leaves Taken: ${analytics.grandtotal}`, {
        align: "left",
      });

    doc.end();
    return await endPromise;
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    throw new Error("Failed to generate PDF report.");
  }
}

export async function generateAndSendReport(email, filters) {
  if (!email) throw new Error("Email is required to send report.");

  try {
    const summaryData = await getSummaryForMail(filters);
    console.log(summaryData);

    if (!summaryData || summaryData.length === 0) {
      console.warn("No data to generate report for", email);
    }

    const [pdfBuffer, excelBuffer, csvBuffer] = await Promise.all([
      generatePDF(filters, summaryData),
      generateExcel(filters, summaryData),
      generateCSV(summaryData),
    ]);

    const info = await transporter.sendMail({
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

    console.log("Mail sent successfully:", info);
    return info.messageId;
  } catch (err) {
    console.error("Error in generateAndSendReport:", err);
    throw new Error("Failed to generate or send report.");
  }
}

export async function generateAndSendHistoryReport(email, filters) {
  if (!email) throw new Error("Email is required to send history report.");

  try {
    // Fetch history
    const rawData = await getHistoryForMail(filters);
    let data =
      typeof rawData === "string" ? JSON.parse(rawData) : rawData || [];

    // 🔹 Ensure it's always an array
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) {
      console.warn("No history data to generate report for", email);
    }

    // Generate reports
    const [pdfBuffer, excelBuffer, csvBuffer] = await Promise.all([
      generateHistoryPDF(data),
      generateHistoryExcel(data),
      generateHistoryCSV(data),
    ]);

    // Send mail
    const info = await transporter.sendMail({
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

    console.log("History mail sent successfully:", info.messageId);
    return info.messageId;
  } catch (err) {
    console.error("Error in generateAndSendHistoryReport:", err);
    throw new Error("Failed to generate or send history report.");
  }
}
