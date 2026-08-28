// ============================================================
// Production Line Quote Comparator — Schema & Comparison Engine
// ============================================================

export type ItemStatus = "Included" | "Missing" | "Unclear" | "Different";

export interface ComparisonCategory {
  id: string;
  name: string;
  items: ComparisonItem[];
}

export interface ComparisonItem {
  id: string;
  name: string;
  type: "status" | "value";
}

export interface Supplier {
  id: string;
  name: string;
  items: Record<string, { status: ItemStatus; value?: string }>;
}

export interface ComparisonResult {
  suppliers: Supplier[];
  missing: Record<string, string[]>;
  unclear: Record<string, string[]>;
  different: { itemId: string; itemName: string; values: { supplierName: string; value: string }[] }[];
  questions: Record<string, string[]>;
}

// ============================================================
// Standard Comparison Schema (7 categories, fixed items)
// ============================================================

export const comparisonCategories: ComparisonCategory[] = [
  {
    id: "equipment-scope",
    name: "Equipment Scope",
    items: [
      { id: "main-machine", name: "Main Machine", type: "status" },
      { id: "auxiliary-equipment", name: "Auxiliary Equipment", type: "status" },
      { id: "feeding-system", name: "Feeding System", type: "status" },
      { id: "conveying-system", name: "Conveying System", type: "status" },
      { id: "cooling-system", name: "Cooling System", type: "status" },
      { id: "pneumatic-system", name: "Air / Pneumatic System", type: "status" },
      { id: "electrical-cabinet", name: "Electrical Cabinet", type: "status" },
      { id: "plc-control", name: "PLC / Control System", type: "status" },
    ],
  },
  {
    id: "tooling",
    name: "Tooling",
    items: [
      { id: "mold-die", name: "Mold / Die", type: "status" },
      { id: "fixtures", name: "Fixtures", type: "status" },
      { id: "cutting-tools", name: "Cutting Tools", type: "status" },
      { id: "change-parts", name: "Change Parts", type: "status" },
    ],
  },
  {
    id: "spare-parts",
    name: "Spare Parts",
    items: [
      { id: "initial-spares", name: "Initial Spare Parts", type: "status" },
      { id: "wear-parts", name: "Wear Parts", type: "status" },
      { id: "consumables", name: "Consumables", type: "status" },
    ],
  },
  {
    id: "technical-specs",
    name: "Technical Specifications",
    items: [
      { id: "capacity", name: "Capacity / Output", type: "value" },
      { id: "power", name: "Power", type: "value" },
      { id: "voltage", name: "Voltage", type: "value" },
      { id: "frequency", name: "Frequency", type: "value" },
      { id: "dimensions", name: "Machine Dimensions", type: "value" },
      { id: "material-compat", name: "Material Compatibility", type: "value" },
    ],
  },
  {
    id: "installation-service",
    name: "Installation & Service",
    items: [
      { id: "installation", name: "Installation", type: "status" },
      { id: "commissioning", name: "Commissioning", type: "status" },
      { id: "engineer-travel", name: "Engineer Travel", type: "status" },
      { id: "training", name: "Training", type: "status" },
      { id: "fat", name: "FAT", type: "status" },
      { id: "sat", name: "SAT", type: "status" },
    ],
  },
  {
    id: "commercial-terms",
    name: "Commercial Terms",
    items: [
      { id: "total-price", name: "Total Price", type: "value" },
      { id: "currency", name: "Currency", type: "value" },
      { id: "incoterm", name: "Incoterm", type: "value" },
      { id: "payment-terms", name: "Payment Terms", type: "value" },
      { id: "lead-time", name: "Lead Time", type: "value" },
      { id: "warranty", name: "Warranty", type: "value" },
    ],
  },
  {
    id: "logistics",
    name: "Logistics",
    items: [
      { id: "packing", name: "Packing", type: "status" },
      { id: "freight", name: "Freight", type: "status" },
      { id: "insurance", name: "Insurance", type: "status" },
      { id: "destination", name: "Destination", type: "value" },
      { id: "inland-transport", name: "Inland Transportation", type: "status" },
    ],
  },
];

// ============================================================
// Comparison Engine
// ============================================================

export function compareSuppliers(suppliers: Supplier[]): ComparisonResult {
  const missing: Record<string, string[]> = {};
  const unclear: Record<string, string[]> = {};
  const different: ComparisonResult["different"] = [];

  for (const supplier of suppliers) {
    missing[supplier.id] = [];
    unclear[supplier.id] = [];
  }

  for (const category of comparisonCategories) {
    for (const item of category.items) {
      const entries = suppliers.map((s) => ({
        supplier: s,
        data: s.items[item.id] || { status: "Missing" as ItemStatus },
      }));

      // Collect missing / unclear per supplier
      for (const { supplier, data } of entries) {
        if (data.status === "Missing") {
          missing[supplier.id].push(item.name);
        }
        if (data.status === "Unclear") {
          unclear[supplier.id].push(item.name);
        }
      }

      // Detect Different for value-type items
      if (item.type === "value") {
        const values = entries
          .map(({ supplier, data }) => ({
            supplierName: supplier.name,
            value: data.value || "—",
          }));
        const unique = [...new Set(values.map((v) => v.value))];
        if (unique.length > 1) {
          different.push({ itemId: item.id, itemName: item.name, values });
        }
      }
    }
  }

  // Generate questions
  const questions: Record<string, string[]> = {};
  for (const supplier of suppliers) {
    const q: string[] = [];
    for (const itemName of missing[supplier.id]) {
      q.push(`Please confirm whether ${itemName.toLowerCase()} is included in the quoted price.`);
    }
    for (const itemName of unclear[supplier.id]) {
      q.push(`Please clarify the scope or conditions for: ${itemName.toLowerCase()}.`);
    }
    for (const diff of different) {
      const sv = diff.values.find((v) => v.supplierName === supplier.name);
      if (sv && sv.value !== "—") {
        const others = diff.values
          .filter((v) => v.supplierName !== supplier.name && v.value !== "—")
          .map((v) => `${v.supplierName}: ${v.value}`);
        if (others.length > 0) {
          q.push(
            `Your ${diff.itemName.toLowerCase()} is ${sv.value}. Other suppliers have ${others.join(", ")}. Please confirm your ${diff.itemName.toLowerCase()} details.`
          );
        }
      }
    }
    questions[supplier.id] = q;
  }

  return { suppliers, missing, unclear, different, questions };
}

// ============================================================
// Draft Types (for user input form)
// ============================================================

export interface DraftItemData {
  status?: ItemStatus;
  value?: string;
}

export interface DraftSupplier {
  id: string;
  name: string;
  items: Record<string, DraftItemData>;
}

// ---------------------------------------------------------------
// Convert draft form data → Supplier[] for compareSuppliers()
// ---------------------------------------------------------------

export function convertDraftToSuppliers(drafts: DraftSupplier[]): Supplier[] {
  return drafts.map((draft) => {
    const items: Supplier["items"] = {};
    for (const category of comparisonCategories) {
      for (const item of category.items) {
        const data = draft.items[item.id];
        if (!data) continue;

        const hasStatus = data.status !== undefined;
        const hasValue = data.value !== undefined && data.value.trim() !== "";

        if (item.type === "status") {
          // Status-type: include if user explicitly selected a status
          if (hasStatus) {
            items[item.id] = { status: data.status! };
          }
        } else {
          // Value-type: include if status set or value entered
          if (hasStatus || hasValue) {
            items[item.id] = {
              status: data.status || (hasValue ? "Included" : "Missing"),
              value: hasValue ? data.value!.trim() : undefined,
            };
          }
        }
      }
    }
    return { id: draft.id, name: draft.name, items };
  });
}
