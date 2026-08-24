import type { Supplier } from "./schema";

export const demoSuppliers: Supplier[] = [
  {
    id: "supplier-a",
    name: "Supplier A",
    items: {
      // Equipment Scope
      "main-machine": { status: "Included" },
      "auxiliary-equipment": { status: "Included" },
      "feeding-system": { status: "Included" },
      "conveying-system": { status: "Included" },
      "cooling-system": { status: "Included" },
      "pneumatic-system": { status: "Included" },
      "electrical-cabinet": { status: "Included" },
      "plc-control": { status: "Included" },
      // Tooling
      "mold-die": { status: "Included" },
      fixtures: { status: "Included" },
      "cutting-tools": { status: "Included" },
      "change-parts": { status: "Included" },
      // Spare Parts
      "initial-spares": { status: "Included" },
      "wear-parts": { status: "Included" },
      consumables: { status: "Included" },
      // Technical Specs
      capacity: { status: "Included", value: "500 pcs/hr" },
      power: { status: "Included", value: "45 kW" },
      voltage: { status: "Included", value: "380V" },
      frequency: { status: "Included", value: "50 Hz" },
      dimensions: { status: "Included", value: "12m x 3m x 2.5m" },
      "material-compat": { status: "Included", value: "PE, PP, PVC" },
      // Installation & Service
      installation: { status: "Included" },
      commissioning: { status: "Included" },
      "engineer-travel": { status: "Unclear" },
      training: { status: "Included" },
      fat: { status: "Included" },
      sat: { status: "Included" },
      // Commercial Terms
      "total-price": { status: "Included", value: "$80,000" },
      currency: { status: "Included", value: "USD" },
      incoterm: { status: "Included", value: "FOB Shanghai" },
      "payment-terms": { status: "Included", value: "30% advance, 70% before shipment" },
      "lead-time": { status: "Included", value: "60 days" },
      warranty: { status: "Included", value: "12 months" },
      // Logistics
      packing: { status: "Included" },
      freight: { status: "Missing" },
      insurance: { status: "Missing" },
      destination: { status: "Included", value: "FOB Shanghai" },
      "inland-transport": { status: "Missing" },
    },
  },
  {
    id: "supplier-b",
    name: "Supplier B",
    items: {
      // Equipment Scope
      "main-machine": { status: "Included" },
      "auxiliary-equipment": { status: "Missing" },
      "feeding-system": { status: "Missing" },
      "conveying-system": { status: "Missing" },
      "cooling-system": { status: "Missing" },
      "pneumatic-system": { status: "Included" },
      "electrical-cabinet": { status: "Included" },
      "plc-control": { status: "Included" },
      // Tooling
      "mold-die": { status: "Missing" },
      fixtures: { status: "Missing" },
      "cutting-tools": { status: "Missing" },
      "change-parts": { status: "Missing" },
      // Spare Parts
      "initial-spares": { status: "Missing" },
      "wear-parts": { status: "Missing" },
      consumables: { status: "Missing" },
      // Technical Specs
      capacity: { status: "Included", value: "450 pcs/hr" },
      power: { status: "Included", value: "38 kW" },
      voltage: { status: "Included", value: "380V" },
      frequency: { status: "Included", value: "50 Hz" },
      dimensions: { status: "Included", value: "10m x 2.5m x 2.2m" },
      "material-compat": { status: "Included", value: "PE, PP" },
      // Installation & Service
      installation: { status: "Missing" },
      commissioning: { status: "Missing" },
      "engineer-travel": { status: "Missing" },
      training: { status: "Missing" },
      fat: { status: "Included" },
      sat: { status: "Missing" },
      // Commercial Terms
      "total-price": { status: "Included", value: "$72,000" },
      currency: { status: "Included", value: "USD" },
      incoterm: { status: "Included", value: "EXW" },
      "payment-terms": { status: "Included", value: "50% advance, 50% before shipment" },
      "lead-time": { status: "Included", value: "45 days" },
      warranty: { status: "Included", value: "12 months" },
      // Logistics
      packing: { status: "Included" },
      freight: { status: "Missing" },
      insurance: { status: "Missing" },
      destination: { status: "Included", value: "EXW Factory" },
      "inland-transport": { status: "Missing" },
    },
  },
  {
    id: "supplier-c",
    name: "Supplier C",
    items: {
      // Equipment Scope
      "main-machine": { status: "Included" },
      "auxiliary-equipment": { status: "Included" },
      "feeding-system": { status: "Included" },
      "conveying-system": { status: "Included" },
      "cooling-system": { status: "Included" },
      "pneumatic-system": { status: "Included" },
      "electrical-cabinet": { status: "Included" },
      "plc-control": { status: "Included" },
      // Tooling
      "mold-die": { status: "Included" },
      fixtures: { status: "Included" },
      "cutting-tools": { status: "Unclear" },
      "change-parts": { status: "Included" },
      // Spare Parts
      "initial-spares": { status: "Included" },
      "wear-parts": { status: "Included" },
      consumables: { status: "Unclear" },
      // Technical Specs
      capacity: { status: "Included", value: "550 pcs/hr" },
      power: { status: "Included", value: "52 kW" },
      voltage: { status: "Included", value: "440V / 60Hz" },
      frequency: { status: "Included", value: "60 Hz" },
      dimensions: { status: "Included", value: "14m x 3.5m x 2.8m" },
      "material-compat": { status: "Included", value: "PE, PP, PVC, PS" },
      // Installation & Service
      installation: { status: "Included" },
      commissioning: { status: "Included" },
      "engineer-travel": { status: "Unclear" },
      training: { status: "Included" },
      fat: { status: "Included" },
      sat: { status: "Included" },
      // Commercial Terms
      "total-price": { status: "Included", value: "$86,000" },
      currency: { status: "Included", value: "USD" },
      incoterm: { status: "Included", value: "CIF" },
      "payment-terms": { status: "Included", value: "30% advance, 70% against B/L" },
      "lead-time": { status: "Included", value: "75 days" },
      warranty: { status: "Included", value: "24 months" },
      // Logistics
      packing: { status: "Included" },
      freight: { status: "Included" },
      insurance: { status: "Unclear" },
      destination: { status: "Included", value: "CIF Destination Port" },
      "inland-transport": { status: "Unclear" },
    },
  },
];
