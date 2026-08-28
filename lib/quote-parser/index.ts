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

  // Convert rows to text: each row becomes a line, cells joined by space
  const text = rows
    .map((row) => row.map((cell) => String(cell ?? "")).join(" ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    text,
    format: "xlsx",
    sheetName: workbook.SheetNames[0],
    rowCount: rows.length,
  };
}
