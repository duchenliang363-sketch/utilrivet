// Quote File Parser — PoC
// Extracts text from PDF and XLSX files for quote checking.
// All processing is client-side. No upload, no server, no AI.

export interface ParseResult {
  text: string;
  format: "pdf" | "xlsx";
  pageCount?: number;
  sheetName?: string;
  rowCount?: number;
}

/**
 * Parse a File object (from file input or drag-and-drop).
 * Routes to PDF or XLSX parser based on MIME type / extension.
 */
export async function parseQuoteFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return parsePDF(file);
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    return parseXLSX(file);
  }
  throw new Error("Unsupported file format. Please upload a PDF or Excel file.");
}

// ─── PDF → Text ───────────────────────────────────────────

async function parsePDF(file: File): Promise<ParseResult> {
  // Dynamic import — pdfjs-dist is browser-only, ~400KB
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");

  // Worker: use matching CDN version (no local bundling needed for PoC)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: buffer,
    isEvalSupported: false,
  }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: Record<string, unknown>) => String(item.str ?? ""))
      .join(" ");
    textParts.push(pageText);
  }

  return {
    text: textParts.join("\n\n"),
    format: "pdf",
    pageCount: pdf.numPages,
  };
}

// ─── XLSX → Text ──────────────────────────────────────────

async function parseXLSX(file: File): Promise<ParseResult> {
  // Dynamic import — xlsx (SheetJS) is browser-only, ~800KB
  const XLSX = await import("xlsx");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
  });

  // Detect the table header row (contains 2+ column keywords).
  // Use it to label each data cell as "ColumnName: Value" so the engine
  // can match field patterns within a single line.
  const HEADER_KEYWORDS = [
    "drawing no", "item no", "description", "specification", "model",
    "unit", "qty", "quantity", "unit price", "total price", "total amount",
    "amount", "remarks", "brand", "no.", "#",
    "序号", "图号", "名称", "规格", "单位", "数量", "单价", "金额", "备注", "品牌"
  ];

  function findHeaderRowIndex(): number {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const lower = rows[i].map((c) => String(c ?? "").toLowerCase().trim());
      const matchCount = lower.filter((cell) =>
        cell.length > 0 && HEADER_KEYWORDS.some((kw) => cell.includes(kw))
      ).length;
      if (matchCount >= 2) return i;
    }
    return -1;
  }

  const headerIdx = findHeaderRowIndex();
  const headers: string[] = headerIdx >= 0
    ? rows[headerIdx].map((c) => String(c ?? "").trim())
    : [];

  const textLines: string[] = [];

  // Rows before the header: likely key-value metadata (Supplier, Date, etc.)
  for (let i = 0; i < (headerIdx >= 0 ? headerIdx : rows.length); i++) {
    const row = rows[i];
    const nonEmpty = row.filter((cell) => String(cell ?? "").trim().length > 0);
    if (nonEmpty.length === 0) continue;

    // 2-cell row with label-like first cell → "Label: Value"
    if (nonEmpty.length === 2) {
      const label = String(nonEmpty[0]).trim();
      const value = String(nonEmpty[1]).trim();
      if (/[a-zA-Z\u4e00-\u9fff]/.test(label) && !/^\d+$/.test(label)) {
        textLines.push(`${label}: ${value}`);
        continue;
      }
    }

    // Multi-cell metadata row: output each cell on its own line
    for (const cell of nonEmpty) {
      const trimmed = String(cell ?? "").trim();
      if (trimmed) textLines.push(trimmed);
    }
  }

  // Rows after the header: table data — output as "ColumnName: CellValue"
  if (headerIdx >= 0) {
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const nonEmpty = row.filter((cell) => String(cell ?? "").trim().length > 0);
      if (nonEmpty.length === 0) continue;

      // Map each cell to its column header
      let hasOutput = false;
      for (let j = 0; j < row.length; j++) {
        const cellVal = String(row[j] ?? "").trim();
        if (!cellVal) continue;
        const colName = headers[j] || `Column${j + 1}`;
        // Skip if column header is empty or looks like a row number
        if (!colName || /^\d+$/.test(colName)) {
          textLines.push(cellVal);
        } else if (cellVal.toLowerCase() === colName.toLowerCase()) {
          // Cell value equals its column header — this is a label cell,
          // not a data value. Skip it; the actual value is in another column.
          continue;
        } else {
          textLines.push(`${colName}: ${cellVal}`);
        }
        hasOutput = true;
      }
      if (!hasOutput && nonEmpty.length > 0) {
        // Fallback: output cells without headers. A cell whose value equals
        // its column header is a label cell (e.g. a repeated header row) —
        // skip it so bare labels never reach the engine.
        for (let j = 0; j < row.length; j++) {
          const cellVal = String(row[j] ?? "").trim();
          if (!cellVal) continue;
          const colName = headers[j] || `Column${j + 1}`;
          if (cellVal.toLowerCase() === colName.toLowerCase()) continue;
          textLines.push(cellVal);
        }
      }
    }
  }

  const text = textLines.join("\n");

  return {
    text,
    format: "xlsx",
    sheetName: workbook.SheetNames[0],
    rowCount: rows.length,
  };
}
