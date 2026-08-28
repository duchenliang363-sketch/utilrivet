// Quote Text → DraftSupplier Mapper (PoC)
// Extracts structured field data from parsed quotation text.
// Maps to Comparator's DraftSupplier format for auto-fill.

import type { DraftSupplier } from "@/lib/quote-comparator/schema";

export interface MappedFields {
  supplierName?: string;
  total_price?: string;
  currency?: string;
  incoterm?: string;
  payment_terms?: string;
  lead_time?: string;
  warranty?: string;
  capacity?: string;
  power?: string;
  voltage?: string;
  frequency?: string;
  dimensions?: string;
  material_compat?: string;
  installation?: boolean;
  commissioning?: boolean;
  training?: boolean;
  fat?: boolean;
  sat?: boolean;
  freight?: boolean;
  insurance?: boolean;
  packing?: boolean;
  destination?: string;
}

/**
 * Map extracted quotation text to structured fields.
 * Returns a partial DraftSupplier that can be merged into the form.
 */
export function mapTextToFields(text: string): MappedFields {
  const lines = text.split(/\r?\n/);
  const fullText = text.toLowerCase();
  const result: MappedFields = {};

  // ─── Commercial Terms (value-type, high confidence) ───

  // Total Price: look for "Total Price:", "Total Amount:", "Grand Total:" patterns
  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (/^(total\s*(price|amount|cost)|grand\s*total)\s*[:：]/i.test(lower)) {
      const val = line.split(/[:：]/).pop()?.trim();
      if (val) result.total_price = val;
      break;
    }
  }
  // Fallback: search anywhere in text
  if (!result.total_price) {
    const m = text.match(/(?:total\s*(?:price|amount|cost)|grand\s*total)\s*[:：]?\s*([^\n]+)/i);
    if (m) result.total_price = m[1].trim();
  }

  // Currency: explicit label or ISO code detection
  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (/^currency\s*[:：]/i.test(lower)) {
      const val = line.split(/[:：]/).pop()?.trim();
      if (val) result.currency = val.toUpperCase();
      break;
    }
  }
  if (!result.currency) {
    const m = text.match(/\b(USD|EUR|GBP|CNY|RMB|JPY|AUD|CAD|CHF|INR|HKD|SGD|KRW|TWD)\b/);
    if (m) result.currency = m[1];
  }

  // Incoterm: FOB, CIF, CFR, EXW, etc.
  const incotermMatch = text.match(/\b(FOB|CIF|CFR|EXW|FCA|FAS|CPT|CIP|DAP|DPU|DDP)\b[\s,]*(\w+)?/i);
  if (incotermMatch) {
    result.incoterm = incotermMatch[0].trim();
  } else {
    for (const line of lines) {
      if (/^(incoterm|trade\s*term|delivery\s*term)\s*[:：]/i.test(line.trim())) {
        result.incoterm = line.split(/[:：]/).pop()?.trim();
        break;
      }
    }
  }

  // Payment Terms
  for (const line of lines) {
    const lower = line.trim();
    if (/^(payment\s*terms?|payment\s*condition|terms?\s*of\s*payment)\s*[:：]/i.test(lower)) {
      result.payment_terms = line.split(/[:：]/).pop()?.trim();
      break;
    }
  }
  if (!result.payment_terms) {
    // Look for deposit/balance/LC/T/T patterns
    const m = text.match(/(?:deposit|advance\s*payment|down\s*payment)[^\n]*?(?:%|percent)[^\n]*/i);
    if (m) result.payment_terms = m[0].trim();
  }

  // Lead Time
  for (const line of lines) {
    const lower = line.trim();
    if (/^(lead\s*time|delivery\s*time|delivery|shipment|ship\s*date)\s*[:：]/i.test(lower)) {
      result.lead_time = line.split(/[:：]/).pop()?.trim();
      break;
    }
  }
  if (!result.lead_time) {
    const m = text.match(/(?:within|after|in)\s+\d+\s+(?:days?|weeks?|months?)[^\n]*/i);
    if (m) result.lead_time = m[0].trim();
  }

  // Warranty
  for (const line of lines) {
    const lower = line.trim();
    if (/^(warranty|guarantee)\s*[:：]/i.test(lower)) {
      result.warranty = line.split(/[:：]/).pop()?.trim();
      break;
    }
  }
  if (!result.warranty) {
    const m = text.match(/(?:warranty|guarantee)[^\n]*(?:month|year|day)[^\n]*/i);
    if (m) result.warranty = m[0].trim();
  }

  // ─── Technical Specs (value-type) ──

  // Capacity / Output
  const capMatch = text.match(/(?:capacity|output|production\s*rate)\s*[:：]?\s*([^\n]+)/i);
  if (capMatch) result.capacity = capMatch[1].trim();

  // Power
  const powerMatch = text.match(/(?:power|motor\s*power|installed\s*power)\s*[:：]?\s*([^\n]+)/i);
  if (powerMatch) result.power = powerMatch[1].trim();

  // Voltage
  const voltMatch = text.match(/(?:voltage|supply\s*voltage|electric\s*supply)\s*[:：]?\s*([^\n]+)/i);
  if (voltMatch) result.voltage = voltMatch[1].trim();

  // Frequency
  const freqMatch = text.match(/(?:frequency|freq\.?)\s*[:：]?\s*([^\n]+)/i);
  if (freqMatch) result.frequency = freqMatch[1].trim();

  // Dimensions
  const dimMatch = text.match(/(?:dimension|size|machine\s*(?:dim|size)|overall\s*(?:dim|size))\s*[:：]?\s*([^\n]+)/i);
  if (dimMatch) result.dimensions = dimMatch[1].trim();

  // Material Compatibility
  const matMatch = text.match(/(?:material|suitable\s*for|compatible\s*with)\s*[:：]?\s*([^\n]+)/i);
  if (matMatch) result.material_compat = matMatch[1].trim();

  // ─── Status-type fields (boolean presence detection) ───

  // Installation
  if (/\binstallation\b/i.test(fullText) && !/\b(not\s*included|excluded|not\s*provided)\b/i.test(fullText)) {
    result.installation = true;
  }

  // Commissioning
  if (/\bcommissioning\b/i.test(fullText)) {
    result.commissioning = true;
  }

  // Training
  if (/\btraining\b/i.test(fullText) && !/\b(not\s*included|excluded)\b/i.test(fullText)) {
    result.training = true;
  }

  // FAT
  if (/\bfat\b/i.test(fullText) && /\b(factory\s*acceptance|factory\s*test)\b/i.test(fullText)) {
    result.fat = true;
  }

  // SAT
  if (/\bsat\b/i.test(fullText) && /\b(site\s*acceptance|site\s*test)\b/i.test(fullText)) {
    result.sat = true;
  }

  // Freight
  if (/\b(freight|shipping|transport)\b/i.test(fullText) && !/\b(not\s*included|excluded|buyer\s*arrange)\b/i.test(fullText)) {
    result.freight = true;
  }

  // Insurance
  if (/\binsurance\b/i.test(fullText) && !/\b(not\s*included|excluded)\b/i.test(fullText)) {
    result.insurance = true;
  }

  // Packing
  if (/\b(pack(ing)?|crate|wooden\s*case)\b/i.test(fullText)) {
    result.packing = true;
  }

  // Destination
  const destMatch = text.match(/(?:destination|delivery\s*to|ship\s*to)\s*[:：]?\s*([^\n]+)/i);
  if (destMatch) result.destination = destMatch[1].trim();

  return result;
}

/**
 * Convert mapped fields to a DraftSupplier ready for the Comparator form.
 */
export function mappedToDraft(fields: MappedFields, supplierName: string, id: string): DraftSupplier {
  const items: DraftSupplier["items"] = {};

  // Value-type fields
  if (fields.total_price) items["total-price"] = { value: fields.total_price };
  if (fields.currency) items["currency"] = { value: fields.currency };
  if (fields.incoterm) items["incoterm"] = { value: fields.incoterm };
  if (fields.payment_terms) items["payment-terms"] = { value: fields.payment_terms };
  if (fields.lead_time) items["lead-time"] = { value: fields.lead_time };
  if (fields.warranty) items["warranty"] = { value: fields.warranty };
  if (fields.capacity) items["capacity"] = { value: fields.capacity };
  if (fields.power) items["power"] = { value: fields.power };
  if (fields.voltage) items["voltage"] = { value: fields.voltage };
  if (fields.frequency) items["frequency"] = { value: fields.frequency };
  if (fields.dimensions) items["dimensions"] = { value: fields.dimensions };
  if (fields.material_compat) items["material-compat"] = { value: fields.material_compat };
  if (fields.destination) items["destination"] = { value: fields.destination };

  // Status-type fields
  if (fields.installation !== undefined) items["installation"] = { status: fields.installation ? "Included" : "Missing" };
  if (fields.commissioning !== undefined) items["commissioning"] = { status: fields.commissioning ? "Included" : "Missing" };
  if (fields.training !== undefined) items["training"] = { status: fields.training ? "Included" : "Missing" };
  if (fields.fat !== undefined) items["fat"] = { status: fields.fat ? "Included" : "Missing" };
  if (fields.sat !== undefined) items["sat"] = { status: fields.sat ? "Included" : "Missing" };
  if (fields.freight !== undefined) items["freight"] = { status: fields.freight ? "Included" : "Missing" };
  if (fields.insurance !== undefined) items["insurance"] = { status: fields.insurance ? "Included" : "Missing" };
  if (fields.packing !== undefined) items["packing"] = { status: fields.packing ? "Included" : "Missing" };

  return { id, name: supplierName, items };
}
