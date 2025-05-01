import { sequelize } from "../config.js";
import { parseError } from "./helpers.js";
import ExcelJS from "exceljs";
import {stringify} from "csv-stringify/sync"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { leaveTypes } from "../validations/leaveValidations.js";

function generateCSV(data) {
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

const uniqueAcronyms = [
  ...new Set(Object.values(leaveTypes).map((type) => type.acronym)),
];

const leaveTypeKeys = Object.keys(leaveTypes); // ['casual', 'medical', ...]

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

export const getReport = async (req, res) => {
  try {
    const user_id = req.body.user_id || null;
    const dept = req.body.dept || null;
    const from = req.body.from || null;
    const to = req.body.to || null;
    const leaveType = req.body.leaveType || null;
    const orderBy = req.body.orderBy || "user_id";

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

    return res.status(200).json(result[0].data);
  } catch (err) {
    console.log(err);
    return res.status(400).send(parseError(err));
  }
};

export const downloadReport = async (req, res) => {
  const user_id = req.body.user_id || null;
  const dept = req.body.dept || null;
  const from = req.body.from || null;
  const to = req.body.to || null;
  const leaveType = req.body.leaveType || null;
  const orderBy = req.body.orderBy || "user_id";
  const format = req.body.format || "csv;";

  try {
    const query = await sequelize.query(
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
    const jsonData = query[0]?.data || [];
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

export const sendMail = async (req, res) => {};
