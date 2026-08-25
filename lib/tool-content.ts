export interface ToolContent {
  slug: string;
  subtitle: string;
  seoSections: {
    title: string;
    content: string;
  }[];
  faq: { question: string; answer: string }[];
}

export const toolContents: Record<string, ToolContent> = {
  "percentage-calculator": {
    slug: "percentage-calculator",
    subtitle: "Calculate percentages, percentage changes, and proportions in seconds.",
    seoSections: [
      {
        title: "What is a Percentage Calculator?",
        content:
          "A percentage calculator is a tool that helps you quickly compute percentages, percentage increases, percentage decreases, and proportional values. Percentages are used in finance, sales, tax calculations, discounts, statistics, and everyday problem-solving.",
      },
      {
        title: "How to Use It",
        content:
          "Enter the values in the input fields and the result is calculated automatically. You can calculate what percentage one number is of another, find a given percentage of a number, or determine the percentage change between two values.",
      },
      {
        title: "Who Is This For?",
        content:
          "This tool is useful for accountants, sales professionals, students, shoppers comparing discounts, and anyone who needs a fast and reliable percentage calculation without manual math.",
      },
    ],
    faq: [
      {
        question: "How do I calculate what percentage X is of Y?",
        answer:
          "Divide X by Y, then multiply by 100. For example, 25 is what percent of 200? (25 / 200) x 100 = 12.5%.",
      },
      {
        question: "How do I calculate a percentage of a number?",
        answer:
          "Multiply the number by the percentage and divide by 100. For example, 15% of 200 = (200 x 15) / 100 = 30.",
      },
      {
        question: "How do I calculate percentage change?",
        answer:
          "Subtract the old value from the new value, divide by the old value, then multiply by 100. For example, from 80 to 100: ((100 - 80) / 80) x 100 = 25% increase.",
      },
      {
        question: "Is this tool free to use?",
        answer:
          "Yes. The Percentage Calculator on UtilRivet is completely free. No sign-up required.",
      },
    ],
  },
  "production-line-quote-comparator": {
    slug: "production-line-quote-comparator",
    subtitle:
      "Compare production line and machinery quotations side by side. Find missing equipment, unclear scope, different specifications, commercial terms and hidden exclusions before selecting a supplier.",
    seoSections: [
      {
        title: "What is a Production Line Quote Comparator?",
        content:
          "A production line quote comparator is a tool that helps buyers compare machinery and equipment quotations from multiple suppliers on a standardized basis. Instead of only looking at total price, it maps each quotation to a fixed comparison schema covering equipment scope, tooling, spare parts, technical specifications, installation and service, commercial terms, and logistics. This allows buyers to identify missing items, unclear scope, and key differences before making a procurement decision.",
      },
      {
        title: "How to Use It",
        content:
          "Upload 2\u20133 supplier quotations or try the built-in demo. The tool extracts key items from each quotation and maps them to a standard comparison matrix. Each item is marked as Included, Missing (not found in the quotation), Unclear (mentioned but scope is not clear), or Different (values vary across suppliers). Below the matrix, the tool highlights missing items, major differences, and generates specific questions to ask each supplier.",
      },
      {
        title: "Who Is This For?",
        content:
          "This tool is designed for overseas buyers purchasing industrial equipment from international suppliers, factory procurement teams, project purchasers, production line buyers, small importers, and equipment distributors. It is especially useful when comparing quotations for production lines, manufacturing machinery, or capital equipment where scope of supply can vary significantly between suppliers.",
      },
      {
        title: "How It Works",
        content:
          "Upload or paste 2\u20133 supplier quotations, or try the built-in demo with sample data. The tool maps each quotation to a standard comparison schema covering equipment scope, tooling, spare parts, technical specifications, installation and service, commercial terms, and logistics. Each item is marked as Included, Missing (not found in the quotation), Unclear (mentioned but scope is not clear), or Different (values vary across suppliers). The tool then highlights missing items, major differences, and generates specific questions to ask each supplier before making a procurement decision.",
      },
      {
        title: "Why Quote Prices Can Be Misleading",
        content:
          "When purchasing production line equipment or industrial machinery, the lowest total price does not always mean the best deal. Suppliers may quote different scopes of supply, making direct price comparison unreliable. One supplier may include auxiliary equipment, tooling, spare parts, installation, and training, while another only includes the main machine. Other common differences include different incoterms (FOB vs. EXW vs. CIF), varying warranty periods, different payment terms, and unclear specifications. This tool helps procurement professionals identify these differences before selecting a supplier, reducing the risk of unexpected costs and procurement mistakes.",
      },
    ],
    faq: [
      {
        question: "Why can\u2019t I just compare total prices?",
        answer:
          "Suppliers often quote different scopes of supply. One quotation may include auxiliary equipment, tooling, installation, and training, while another only includes the main machine. Comparing total prices without checking scope can lead to incorrect procurement decisions and unexpected additional costs.",
      },
      {
        question: "What does \u201cMissing\u201d mean?",
        answer:
          "\u201cMissing\u201d means the item was not found in the quotation. It does not mean the supplier definitely excludes it. The supplier may simply not have listed it. You should confirm directly with the supplier.",
      },
      {
        question: "What does \u201cUnclear\u201d mean?",
        answer:
          "\u201cUnclear\u201d means the item is mentioned in the quotation, but the scope, conditions, or specifications are not clearly defined. You should ask the supplier for clarification.",
      },
      {
        question: "Is my quotation data uploaded to a server?",
        answer:
          "In the current demo version, no real file analysis is performed. The demo uses pre-built sample data. When file analysis becomes available, uploaded files will be processed for extraction only and will not be stored or shared.",
      },
      {
        question: "Is this tool free?",
        answer:
          "Yes. The Production Line Quote Comparator on UtilRivet is currently free to use. No sign-up required.",
      },
    ],
  },
  "business-document-difference-checker": {
    slug: "business-document-difference-checker",
    subtitle:
      "Compare two business documents and quickly find changes in prices, quantities, payment terms, delivery, warranty and scope.",
    seoSections: [
      {
        title: "What is a Business Document Difference Checker?",
        content:
          "A business document difference checker is a tool that compares two versions of a commercial document and highlights the important changes between them. Instead of showing every minor text change like a generic diff tool, it focuses on the changes that matter for business decisions: price changes, quantity adjustments, payment term modifications, delivery time shifts, warranty reductions, and scope additions or removals. This makes it especially useful for procurement professionals, sales teams, and operations staff who need to quickly understand what changed between document versions.",
      },
      {
        title: "Why Compare Business Documents?",
        content:
          "In purchasing, manufacturing, sales, and import/export operations, documents are frequently revised. A supplier may send an original quote and then a revised version with different prices or terms. A purchase order may differ from the invoice. A contract may be updated between versions. Manually comparing these documents is time-consuming and error-prone. A dedicated difference checker helps you spot important changes quickly, reducing the risk of overlooking critical modifications that could affect costs, timelines, or legal obligations.",
      },
      {
        title: "What Changes Should You Look For?",
        content:
          "When comparing business documents, the most important changes typically involve: price increases or decreases, changes in payment terms such as deposit percentages, delivery time extensions or reductions, warranty period changes, items that were included but are now excluded or vice versa, freight and shipping cost changes, validity period modifications, and any new or removed line items. These changes can significantly impact the total cost of a deal and should always be verified before proceeding.",
      },
      {
        title: "Common Use Cases",
        content:
          "This tool is commonly used to compare an original supplier quote against a revised quote, compare a quote against a purchase order to verify alignment, compare a purchase order against an invoice to check for discrepancies, compare two versions of a contract to identify modified terms, and compare an invoice against a packing list to verify shipped items. It is suitable for purchasing teams, manufacturing operations, sales professionals, import/export coordinators, and small business owners who regularly deal with commercial documents.",
      },
    ],
    faq: [
      {
        question: "Can I compare two business documents?",
        answer:
          "Yes. Paste the text of both documents into the input fields and click Compare Documents. The tool will identify all changes between the two documents and highlight the most important ones.",
      },
      {
        question: "What types of changes does the tool detect?",
        answer:
          "The tool detects four types of changes: CHANGED (a value was modified), ADDED (a new item appears in Document B), REMOVED (an item from Document A is missing in Document B), and UNCHANGED (items that are identical in both documents). It also calculates numeric differences for prices, percentages, days, and months.",
      },
      {
        question: "Can I compare supplier quotations?",
        answer:
          "Yes. This is one of the primary use cases. Paste the original quote as Document A and the revised quote as Document B. The tool will highlight price changes, term modifications, and any items that were added or removed.",
      },
      {
        question: "Can I compare a quote and purchase order?",
        answer:
          "Yes. Paste the quote as Document A and the purchase order as Document B. The tool will show you any differences in prices, quantities, terms, or scope between the two documents.",
      },
      {
        question: "Can I compare invoices?",
        answer:
          "Yes. You can compare any two text-based business documents, including invoices, packing lists, contracts, and purchase orders.",
      },
      {
        question: "Are my documents uploaded to a server?",
        answer:
          "No. Your document text is processed entirely in your browser. Nothing is uploaded, stored, or transmitted to any server.",
      },
      {
        question: "Can this replace legal review?",
        answer:
          "No. This tool highlights document differences for review purposes only. Always verify important commercial and legal terms against the original documents and consult with appropriate professionals when needed.",
      },
    ],
  },
  "compressed-air-leak-cost-calculator": {
    slug: "compressed-air-leak-cost-calculator",
    subtitle:
      "Estimate the annual energy and electricity cost of a compressed air leak. Calculate leak power, wasted kWh, potential savings and repair payback.",
    seoSections: [
      {
        title: "What is a Compressed Air Leak Cost Calculator?",
        content:
          "A compressed air leak cost calculator is a tool that estimates how much money a compressed air leak wastes in energy and electricity over time. Compressed air is one of the most expensive utilities in manufacturing, and even small leaks can cost thousands of dollars per year. This calculator helps maintenance managers, plant managers, and energy auditors quantify the financial impact of air leaks and prioritize repairs based on estimated savings and payback period.",
      },
      {
        title: "Why Do Compressed Air Leaks Cost Money?",
        content:
          "Compressed air systems require significant electrical energy to operate. When air leaks from the system, the compressor must work harder and run longer to maintain pressure, consuming more electricity. A single small leak can waste enough energy to cost hundreds or thousands of dollars annually. In many facilities, compressed air leaks account for 20-30% of total compressed air production, representing a major opportunity for energy savings and cost reduction.",
      },
      {
        title: "How is Compressed Air Leak Cost Calculated?",
        content:
          "The calculator uses four key inputs: leak flow rate (in CFM, L/s, or m³/min), operating hours per day and days per year, electricity rate per kWh, and compressor specific power (kW per 100 CFM). It calculates the leak power consumption, annual energy waste in kWh, and converts this to an annual cost using your electricity rate. If you provide an estimated repair cost, it also calculates the payback period to help you prioritize which leaks to fix first.",
      },
      {
        title: "How Can Manufacturers Reduce Compressed Air Leakage?",
        content:
          "Manufacturers can reduce compressed air leakage through regular leak detection surveys using ultrasonic detectors, prompt repair of identified leaks, proper maintenance of fittings and hoses, installation of automatic drain valves, optimization of system pressure to match actual needs, and employee training on leak awareness. Many facilities find that implementing a systematic leak management program pays for itself within months through reduced energy costs.",
      },
    ],
    faq: [
      {
        question: "What is a compressed air leak cost calculator?",
        answer:
          "It is a tool that estimates the annual energy and electricity cost of a compressed air leak based on leak flow rate, operating hours, electricity rate, and compressor specific power. It helps you quantify the financial impact of air leaks and prioritize repairs.",
      },
      {
        question: "How much does a compressed air leak cost?",
        answer:
          "The cost depends on leak size, operating hours, electricity rate, and compressor efficiency. A small 1/8 inch leak at 100 PSI can cost over $2,000 per year in many facilities. Use this calculator with your specific parameters to get an accurate estimate.",
      },
      {
        question: "How do you calculate compressed air leak energy loss?",
        answer:
          "Energy loss is calculated by converting leak flow rate to CFM, multiplying by compressor specific power (kW/100 CFM) to get leak power in kW, then multiplying by annual operating hours to get kWh, and finally multiplying by electricity rate to get annual cost.",
      },
      {
        question: "What is compressor specific power?",
        answer:
          "Specific power is the electrical power required to produce 100 CFM of compressed air, measured in kW/100 CFM. It varies by compressor type, size, and efficiency. Typical values range from 15-25 kW/100 CFM. Use your compressor's actual specific power when available for more accurate results.",
      },
      {
        question: "How accurate is this calculator?",
        answer:
          "This calculator provides estimates based on standard engineering formulas. Actual results may vary depending on compressor efficiency, control strategy, system pressure, operating schedule, and electricity tariff. For higher accuracy, use measured leak flow and your compressor's actual specific power.",
      },
      {
        question: "Can I use CFM, L/s and m³/min?",
        answer:
          "Yes. The calculator accepts leak flow rate in CFM, L/s (liters per second), or m³/min (cubic meters per minute). All values are internally converted to CFM for calculation. 1 L/s ≈ 2.12 CFM and 1 m³/min ≈ 35.31 CFM.",
      },
      {
        question: "How do I calculate repair payback?",
        answer:
          "Enter your estimated repair cost in the calculator. The tool divides repair cost by potential annual savings to calculate payback period in months and years. This helps you prioritize which leaks to fix first based on return on investment.",
      },
      {
        question: "Does system pressure affect leak cost?",
        answer:
          "Yes. Higher system pressure increases leak flow rate and energy consumption. A leak at 120 PSI costs more than the same size leak at 80 PSI. This calculator uses leak flow rate as input, which already reflects the effect of system pressure. For more accurate results, measure leak flow at your actual operating pressure.",
      },
    ],
  },
};

export function getToolContent(slug: string): ToolContent | undefined {
  return toolContents[slug];
}
