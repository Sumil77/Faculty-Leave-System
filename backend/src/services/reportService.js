import { transporter, sequelize, EMAIL_USER } from "../config.js";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { leaveTypes } from "../validators/leaveValidations.js";

const leaveTypeKeys = Object.keys(leaveTypes);

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
const safeValue = (row, key) => (row[key] != null ? row[key] : 0);


export async function getHistory(filters = {}) {
  try {
    const {
      user_ids = null,
      dept = null,
      from = null,
      to = null,
      leaveType = null,
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
         :leave_type::text,
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
          leave_type: leaveType,
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
      leaveType = null,
      orderBy = "user_id",
    } = filters;

    const MAX_ROWS = 500000; // safe upper bound for reports

    const result = await sequelize.query(
      `SELECT get_leave_history_json(
         :user_ids::int[],
         :dept::text,
         :from::date,
         :to::date,
         :leave_type::text,
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
          leave_type: leaveType,
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

  const rows = data.map((leave) => [
    leave.user_id,
    leave.name,
    leave.dept,
    formatDate(leave.appliedOn),
    formatDate(leave.fromDate),
    formatDate(leave.toDate),
    leave.leaveType,
    leave.totalDays,
  ]);

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

  const rows = data.map((leave) => ({
    user_id: leave.user_id,
    name: leave.name,
    dept: leave.dept,
    appliedOn: formatDate(leave.appliedOn),
    fromDate: formatDate(leave.fromDate),
    toDate: formatDate(leave.toDate),
    leaveType: leave.leaveType,
    totalDays: leave.totalDays,
  }));

  const columns = Object.keys(rows[0]).map((key) => ({
    header: headerMap[key] || key,
    key,
    width:
      Math.max(
        headerMap[key]?.length || key.length,
        ...rows.map((row) => String(row[key] ?? "").length)
      ) + 2,
  }));

  worksheet.columns = columns;
  worksheet.addRows(rows);

  return await workbook.xlsx.writeBuffer();
}

export async function generateHistoryPDF(data) {
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

  const rows = data.map((leave) => [
    leave.user_id,
    leave.name,
    leave.dept,
    formatDate(leave.appliedOn),
    formatDate(leave.fromDate),
    formatDate(leave.toDate),
    leave.leaveType,
    leave.totalDays,
  ]);

  const getTextWidth = (text) => font.widthOfTextAtSize(String(text), fontSize);

  const colWidths = headers.map((header, i) => {
    const headerWidth = getTextWidth(header);
    const dataWidth = Math.max(...rows.map((row) => getTextWidth(row[i])));
    return Math.max(headerWidth, dataWidth) + colPadding * 2;
  });

  const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const pageWidth = 595.28; // A4 portrait width
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

  drawRow(headers, true);
  y -= rowHeight;

  for (const row of rows) {
    if (y - rowHeight < margin) {
      page = pdfDoc.addPage();
      y = pageHeight - margin;
      drawRow(headers, true);
      y -= rowHeight;
    }
    drawRow(row);
    y -= rowHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function getSummary(filters = {}) {
  try {
    const {
      user_id = null,
      dept = null,
      from = null,
      to = null,
      leaveType = null,
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
          :leaveType::text,
          :orderBy::text,
          :limit,
          :offset
       ) AS data`,
      {
        replacements: {
          user_id,
          dept,
          from_date: from,
          to_date: to,
          leaveType,
          orderBy,
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
      leaveType = null,
      orderBy = "user_id",
    } = filters;

    const MAX_ROWS = 500000; // safe cap for mailing

    const result = await sequelize.query(
      `SELECT get_dynamic_leave_summary(
          :user_id::int,
          :dept::text,
          :from_date::date,
          :to_date::date,
          :leaveType::text,
          :orderBy::text,
          :limit,
          :offset
       ) AS data`,
      {
        replacements: {
          user_id,
          dept,
          from_date: from,
          to_date: to,
          leaveType,
          orderBy,
          limit: MAX_ROWS,
          offset: 0,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!result || !result[0] || !result[0].data) {
      return [];
    }

    const summary =
      typeof result[0].data === "string"
        ? JSON.parse(result[0].data)
        : result[0].data;

    // ✅ Mailing version only needs rows
    return summary?.rows || [];
  } catch (err) {
    console.error("Error fetching leave summary for mail:", err);
    throw new Error("Failed to fetch leave summary for mail.");
  }
}

export async function generateCSV(data) {
  try {
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

export async function generateExcel(data) {
  try {
    data = Array.isArray(data) ? data : data?.rows || [];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leave Summary");

    if (!data.length) return await workbook.xlsx.writeBuffer();

    const columns = [
      { key: "user_id", label: "UID" },
      { key: "name", label: "Name" },
      { key: "dept", label: "Dept" },
      ...leaveTypeKeys.map((key) => ({ key, label: leaveTypes[key].acronym })),
    ];

    worksheet.columns = columns.map((col) => ({
      header: col.label,
      key: col.key,
      width: col.label.length + 2,
    }));

    data.forEach((row) => {
      const rowData = {};
      columns.forEach((col) => (rowData[col.key] = safeValue(row, col.key)));
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((column) => {
      let maxLength = column.header.length;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > maxLength) maxLength = len;
      });
      column.width = maxLength + 2;
    });

    return await workbook.xlsx.writeBuffer();
  } catch (err) {
    console.error("Error generating Excel:", err);
    throw new Error("Failed to generate Excel report.");
  }
}

export async function generatePDF(data) {
  try {
    data = Array.isArray(data) ? data : data?.rows || [];

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 10,
      margin = 40,
      rowHeight = 20,
      colPadding = 5;

    const staticColumns = [
      { key: "user_id", label: "UID" },
      { key: "name", label: "Name" },
      { key: "dept", label: "Dept" },
    ];

    const leaveColumns = leaveTypeKeys.map((key) => ({
      key,
      label: leaveTypes[key].acronym,
    }));

    const columns = [...staticColumns, ...leaveColumns];

    const getTextWidth = (text) =>
      font.widthOfTextAtSize(String(text), fontSize);

    const colWidths = columns.map((col) => {
      const headerWidth = getTextWidth(col.label);
      const dataWidth = Math.max(
        ...data.map((row) => getTextWidth(String(safeValue(row, col.key))))
      );
      return Math.max(headerWidth, dataWidth) + colPadding * 2;
    });

    const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);
    const pageWidth = 595.28; // A4 width in points
    const tableStartX = Math.max(margin, (pageWidth - totalTableWidth) / 2);

    let page = pdfDoc.addPage();
    let y = page.getHeight() - margin;

    const drawRow = (row, isHeader = false) => {
      let x = tableStartX;
      columns.forEach((col, i) => {
        const value = isHeader ? col.label : String(safeValue(row, col.key));

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

    drawRow(null, true); // header
    y -= rowHeight;

    for (const row of data) {
      if (y - rowHeight < margin) {
        page = pdfDoc.addPage();
        y = page.getHeight() - margin;
        drawRow(null, true); // header again
        y -= rowHeight;
      }
      drawRow(row);
      y -= rowHeight;
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("Error generating PDF:", err);
    throw new Error("Failed to generate PDF report.");
  }
}

export async function generateAndSendReport(email, filters) {
  if (!email) throw new Error("Email is required to send report.");

  try {
    const summaryData = await getSummaryForMail(filters);

    if (!summaryData || summaryData.length === 0) {
      console.warn("No data to generate report for", email);
    }

    const [pdfBuffer, excelBuffer, csvBuffer] = await Promise.all([
      generatePDF(summaryData),
      generateExcel(summaryData),
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
