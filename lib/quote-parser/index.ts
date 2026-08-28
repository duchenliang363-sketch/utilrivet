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

  // Detect header rows and data rows separately.
  // Header rows contain field labels (Qty, Price, Amount, Unit, etc.) — skip them.
  // Data rows contain actual values — output each non-empty cell on its own line.
  const HEADER_KEYWORDS = [
    "drawing no", "item no", "description", "specification", "model",
    "unit", "qty", "quantity", "unit price", "total amount", "remarks",
    "no.", "#", "序号", "图号", "名称", "规格", "单位", "数量", "单价", "金额", "备注"
  ];

  function isHeaderRow(row: string[]): boolean {
    const lower = row.map((c) => String(c ?? "").toLowerCase().trim());
    const matchCount = lower.filter((cell) =>
      HEADER_KEYWORDS.some((kw) => cell.includes(kw))
    ).length;
    return matchCount >= 2; // At least 2 header keywords = likely a header row
  }

  // Build text: label-style lines first (for "Label: Value" format), then table cells
  const textLines: string[] = [];
  for (const row of rows) {
    if (isHeaderRow(row)) continue; // Skip table headers
    const nonEmpty = row.filter((cell) => String(cell ?? "").trim().length > 0);
    if (nonEmpty.length === 0) continue;

    // If row has exactly 2 cells and first looks like a label, output as "Label: Value"
    if (nonEmpty.length === 2) {
      const label = String(nonEmpty[0]).trim();
      const value = String(nonEmpty[1]).trim();
      // Check if first cell looks like a label (contains letters, not just numbers)
      if (/[a-zA-Z]/.test(label) && !/^\d+$/.test(label)) {
        textLines.push(`${label}: ${value}`);
        continue;
      }
    }

    // Otherwise output each cell on its own line
    for (const cell of nonEmpty) {
      const trimmed = String(cell ?? "").trim();
      if (trimmed) textLines.push(trimmed);
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
