export interface ToolContent {
  slug: string;
  subtitle: string;
  metaDescription?: string;
  seoSections: {
    title: string;
    content: string;
    cta?: { label: string; slug: string };
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
        cta: {
          label: "Surveying a whole plant? Record multiple leaks and build a full survey report",
          slug: "compressed-air-leak-survey-report-builder",
        },
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
  "supplier-quote-completeness-checker": {
    slug: "supplier-quote-completeness-checker",
    subtitle:
      "Check a supplier quotation for missing prices, quantities, MOQ, lead time, payment terms, freight, Incoterms, warranty and other key commercial terms.",
    seoSections: [
      {
        title: "What is a Supplier Quote Completeness Checker?",
        content:
          "A supplier quote completeness checker is a free web tool that scans the text of a supplier quotation and identifies which key commercial fields are present, missing, or unclear. Instead of reviewing each quotation line by line, procurement professionals can paste the quote text and instantly see gaps such as a missing MOQ, Incoterm, freight statement, or quote validity. It works as an automated quotation checklist for buyers, sourcing specialists, and small businesses.",
      },
      {
        title: "What Should a Supplier Quotation Include?",
        content:
          "A complete supplier quotation should include the supplier name, quote number and date, product description, quantity, unit price and total price with a clear currency, MOQ, lead time, payment terms, freight or shipping arrangement, Incoterm, taxes and duties, warranty, quote validity, and — for equipment purchases — installation, training, and spare parts details. This checker reviews 19 common fields so nothing important is overlooked before you compare or approve a quote.",
      },
      {
        title: "Why Should Buyers Check Quotations Before Comparing Them?",
        content:
          "Comparing incomplete quotations leads to wrong decisions. A quote that looks cheaper may exclude freight, taxes, or installation that a competitor includes. By checking completeness first, buyers can ask suppliers the right questions and get comparable, like-for-like offers. Once a quotation is complete, it can be compared against other supplier quotes using the Production Line Quote Comparator.",
      },
      {
        title: "Common Information Missing from Supplier Quotes",
        content:
          "In practice, the most commonly missing items are the Incoterm, freight arrangement, quote validity period, MOQ, and tax or duty statements. Equipment quotations also frequently omit installation scope, operator training, and spare parts recommendations. Asking about these items up front avoids surprise costs and delays later in the order process.",
      },
    ],
    faq: [
      {
        question: "What should be included in a supplier quotation?",
        answer:
          "A solid quotation includes the supplier name, quote number and date, product description, quantity, unit and total price with currency, MOQ, lead time, payment terms, freight arrangement, Incoterm, taxes and duties, warranty, and quote validity. For machinery and equipment, installation, training, and spare parts should also be stated.",
      },
      {
        question: "How do I check if a supplier quote is complete?",
        answer:
          "Paste the quotation text into this checker and click Check Quote. The tool scans the text with rule-based matching, scores completeness as a percentage, and lists every missing or unclear field so you know exactly what to follow up on.",
      },
      {
        question: "What information is commonly missing from quotations?",
        answer:
          "The most commonly missing items are the Incoterm, freight or shipping costs, quote validity, MOQ, and tax or duty statements. Equipment quotes often omit installation, training, and spare parts details.",
      },
      {
        question: "Why are payment terms important in a supplier quote?",
        answer:
          "Payment terms define your cash flow exposure, including the deposit amount, balance timing, and payment method. Without clear payment terms, buyers risk unexpected advance payment demands or unfavorable conditions after the order is placed.",
      },
      {
        question: "Should a quotation include an Incoterm?",
        answer:
          "Yes, especially for international trade. The Incoterm (for example FOB Shanghai or CIF Rotterdam) defines who pays freight, insurance, and duties, and where risk transfers. Quotes without an Incoterm are difficult to compare fairly.",
      },
      {
        question: "What is quotation validity?",
        answer:
          "Quote validity states how long the quoted prices and terms remain in effect, for example 30 days. Raw material prices and freight rates change, so a quote without a validity period may no longer be honored by the time you are ready to order.",
      },
      {
        question: "Does this tool verify whether a price is competitive?",
        answer:
          "No. This tool only checks whether common quotation fields are present, missing, or unclear. It does not judge whether prices or terms are competitive, favorable, or legally sufficient. Always review the commercial terms yourself.",
      },
      {
        question: "Is my supplier quotation uploaded or stored?",
        answer:
          "No. All checks run locally in your browser using rule-based text matching. Your quotation text is never uploaded, stored, or shared.",
      },
    ],
  },
  "boiler-blowdown-cost-savings-calculator": {
    slug: "boiler-blowdown-cost-savings-calculator",
    subtitle:
      "Estimate boiler blowdown energy loss, water waste and annual cost savings from reducing blowdown rates.",
    seoSections: [
      {
        title: "What is a Boiler Blowdown Cost Calculator?",
        content:
          "A boiler blowdown cost calculator estimates how much energy, water, and money a steam boiler loses through blowdown. Blowdown is the controlled removal of concentrated boiler water to control dissolved solids, but every gallon of blowdown carries hot water and heat out of the system. This tool quantifies that blowdown energy loss and shows the potential annual savings from reducing the blowdown rate, for example through better water treatment or automatic blowdown control.",
      },
      {
        title: "Why Does Boiler Blowdown Cost Money?",
        content:
          "Blowdown water leaves the boiler near saturation temperature, carrying both treated water and the heat used to raise it. The losses have two parts: fuel burned to heat the blowdown water from feedwater temperature to boiler temperature, and the cost of the make-up water and sewer discharge itself. On boilers with high blowdown rates, these losses can add up to thousands of dollars per year in fuel and water costs.",
      },
      {
        title: "How Are Blowdown Savings Calculated?",
        content:
          "The calculator converts blowdown rates into blowdown flow based on steam production, then compares the current and target blowdown flows. The reduction is multiplied by the heat difference between saturated boiler water and feedwater temperature to get annual energy loss in MMBtu, which is converted into fuel cost using boiler efficiency and fuel price. Reduced blowdown flow is also converted into gallons of water saved per year and valued at your water and sewer rate.",
      },
      {
        title: "How Can Plants Reduce Blowdown Losses?",
        content:
          "Common measures include improving feedwater quality with softeners or reverse osmosis, installing automatic blowdown control based on conductivity, recovering blowdown heat with a flash tank or heat exchanger, and fixing leaking blowdown valves. Even a few percentage points of blowdown reduction on a large boiler can meaningfully improve steam boiler efficiency and lower operating costs.",
      },
    ],
    faq: [
      {
        question: "What is boiler blowdown?",
        answer:
          "Blowdown is the removal of a portion of concentrated boiler water to keep dissolved and suspended solids within safe limits. It protects the boiler but wastes hot, treated water, which is why blowdown rate is a key lever for boiler water savings and energy savings.",
      },
      {
        question: "How is blowdown rate defined?",
        answer:
          "Blowdown rate is typically expressed as a percentage of feedwater flow. In this calculator, blowdown flow is derived from steam production using blowdown = steam × rate / (100 − rate), which is equivalent to expressing the rate as a share of feedwater.",
      },
      {
        question: "What is a typical boiler blowdown rate?",
        answer:
          "Many industrial boilers run between 2% and 10% blowdown depending on feedwater quality and water treatment. Boilers with poor feedwater treatment may run higher. Lower is better for efficiency, but blowdown must stay high enough to control dissolved solids safely.",
      },
      {
        question: "How much can I save by reducing blowdown?",
        answer:
          "Savings depend on steam output, pressure, feedwater temperature, operating hours, fuel cost, and water cost. Use this boiler blowdown savings calculator with your own numbers — reducing blowdown from 10% to 5% on a mid-size boiler often saves thousands of dollars per year.",
      },
      {
        question: "Why does feedwater temperature matter?",
        answer:
          "The energy lost with blowdown is the heat needed to raise water from feedwater temperature to boiler saturation temperature. Colder feedwater means each pound of blowdown wastes more heat, so hot feedwater (for example from a deaerator) reduces the energy loss per pound of blowdown.",
      },
      {
        question: "Can I use metric units?",
        answer:
          "Yes. Steam production accepts lb/hr and kg/hr, boiler pressure accepts psi and bar, and feedwater temperature accepts °F and °C. All values are converted internally before calculation.",
      },
      {
        question: "How accurate are these estimates?",
        answer:
          "The tool uses standard approximations, including an approximate saturation temperature table and simplified water enthalpy. Estimates are intended for preliminary energy and cost analysis; actual boiler performance depends on operating conditions, water chemistry and system design.",
      },
    ],
  },
  "condensate-return-savings-calculator": {
    slug: "condensate-return-savings-calculator",
    subtitle:
      "Estimate annual fuel, water and wastewater savings from increasing condensate return in an industrial steam system.",
    seoSections: [
      {
        title: "What is a condensate return savings calculator?",
        content:
          "A condensate return savings calculator estimates how much money an industrial facility can save by recovering and returning more hot condensate to the boiler instead of discharging it to drain. When condensate is lost, the boiler must make up with cold fresh water and reheat it to steam temperature, wasting both fuel and treated water. This calculator quantifies those losses and shows the potential savings from improving condensate recovery.",
      },
      {
        title: "Why does returning condensate save energy?",
        content:
          "Condensate leaving steam equipment is typically near saturation temperature — often 180°F or higher. Returning this hot water back to the boiler feedwater system recovers its sensible heat, reducing the fuel needed to raise cold makeup water to boiling temperature. Every pound of returned condensate avoids heating a pound of cold makeup water from ambient temperature to near-boiling, which directly reduces fuel consumption and operating cost.",
      },
      {
        title: "How does condensate recovery reduce water costs?",
        content:
          "Returned condensate is already treated boiler feedwater — it has been softened, deaerated, and chemically conditioned. When condensate is not recovered, the boiler must replace it with fresh raw water that requires treatment chemicals, filtration, and possibly softening. Additionally, every gallon of makeup water that enters the boiler eventually leaves as blowdown or steam vented to atmosphere, incurring sewer or wastewater discharge charges. Recovering condensate reduces both water purchase costs and sewer discharge volumes.",
      },
      {
        title: "What affects condensate recovery savings?",
        content:
          "The main factors affecting savings are: steam production rate (larger systems save more per percentage point of recovery improvement), current versus target return rate (the bigger the gap, the higher the potential savings), condensate temperature (hotter condensate carries more recoverable heat), makeup water temperature (colder makeup means more fuel savings per pound recovered), boiler efficiency (lower efficiency amplifies fuel savings from recovered heat), fuel price, water and sewer rates, and annual operating hours. Facilities with continuous operation and high fuel or water costs see the fastest payback on condensate return improvements.",
      },
    ],
    faq: [
      {
        question: "What is condensate return?",
        answer:
          "Condensate return is the practice of collecting hot condensed steam from heat exchangers, radiators, tracing lines, and process equipment, and piping it back to the boiler feedwater system instead of draining it to the sewer. Returned condensate retains most of its heat and has already been chemically treated, making it valuable to the steam system.",
      },
      {
        question: "Why does condensate recovery save fuel?",
        answer:
          "Because condensate is hot — typically 180–200°F — while makeup water is cold — typically 50–70°F. Returning condensate avoids the fuel cost of reheating cold makeup water from ambient temperature to near-boiling. The fuel savings are roughly proportional to the temperature difference between condensate and makeup water, multiplied by the mass of condensate recovered.",
      },
      {
        question: "How much water can condensate return save?",
        answer:
          "For every pound of steam produced, approximately one pound of condensate can theoretically be returned. If your boiler produces 10,000 lb/hr of steam and you improve return from 40% to 75%, you recover an additional 3,500 lb/hr of condensate — about 420 gallons per hour or over 1 million gallons per year at typical operating schedules. That is 1 million fewer gallons of makeup water to purchase, treat, and eventually discharge.",
      },
      {
        question: "How is condensate return savings calculated?",
        answer:
          "The calculator determines additional condensate returned by multiplying annual steam production by the increase in return rate percentage. It then calculates water saved (using 8.34 lb/gallon density), sensible heat recovered (using 1 Btu/lb·°F specific heat and the temperature difference between condensate and makeup water), fuel energy saved (dividing recovered heat by boiler efficiency), and converts each into dollar savings using your fuel cost, water cost, and sewer cost inputs.",
      },
      {
        question: "Does condensate temperature affect savings?",
        answer:
          "Yes, significantly. Higher condensate temperature means more sensible heat recovered per pound. Condensate at 200°F saves roughly twice as much fuel as condensate at 130°F when makeup water is 60°F, because the temperature difference — and thus the recoverable heat — is about doubled. This is why keeping condensate hot and well-insulated during return is important.",
      },
      {
        question: "How accurate is this calculator?",
        answer:
          "This calculator provides preliminary estimates based on simplified thermodynamic assumptions: constant specific heat of 1 Btu/lb·°F, no flash steam recovery, no pressure-dependent enthalpy corrections, and constant water density. Actual savings depend on steam pressure, flash steam losses, condensate quality degradation, deaerator performance, and system-specific design. Use this tool for scoping and justification; detailed engineering analysis should follow before major capital investment.",
      },
      {
        question: "Can I use kg/hr and Celsius?",
        answer:
          "Yes. Steam production accepts both lb/hr and kg/hr, and temperatures accept both °F and °C. Select your preferred unit from the dropdown next to each input field. All values are converted internally to consistent units (lb/hr and °F) before calculation, so results remain the same regardless of which unit system you choose.",
      },
      {
        question: "How do I calculate condensate recovery payback?",
        answer:
          "Enter your estimated project or upgrade cost in the Project / Upgrade Cost field. The calculator divides this cost by total annual savings to compute the payback period in months. If payback is less than 12 months, it shows in months; if longer, it shows years and remaining months. Leave this field blank or set to zero if you only want to see savings without payback analysis.",
      },
    ],
  },
  "compressed-air-leak-survey-report-builder": {
    slug: "compressed-air-leak-survey-report-builder",
    subtitle:
      "Record compressed air leaks, estimate annual losses, prioritize repairs, and build a clear survey report directly in your browser.",
    metaDescription:
      "Record compressed air leaks, estimate annual energy loss, prioritize repairs, and create a clear survey report online. No signup required.",
    seoSections: [
      {
        title: "What is a compressed air leak survey?",
        content:
          "A compressed air leak survey is a structured process for managing leaks in a compressed air system: locate each leak, identify and tag it, measure or estimate its flow, document the findings, prioritize repairs, fix the leaks, and verify the results. Instead of remembering leak locations or keeping scattered notes, the survey produces one structured record — the basis of a compressed air leak survey report, leak log, or inspection report. Because leaking air is paid for twice — once to compress it and again in lost production capacity — a regular survey is one of the most reliable ways to reduce compressed air energy cost. Instead of starting with a blank spreadsheet or paper leak log, this builder provides a structured browser-based workflow for the whole process.",
      },
      {
        title: "What should a compressed air leak survey report include?",
        content:
          "A useful compressed air leak report documents the survey itself and every leak found: the survey date, facility or area, system operating assumptions, and for each leak a tag or ID, location, equipment, estimated flow, annual energy loss, annual cost, repair priority, and repair status. The summary should show the total estimated annual loss, the loss still open, and a repair list ordered by priority. This builder produces exactly that structure and lets you copy the summary as text or print it as a PDF — the same fields used in common compressed air leak survey templates and leak log sheets.",
      },
      {
        title: "How to use this compressed air leak survey tool",
        content:
          "1. Enter the survey settings: project, facility, date, operating hours, electricity rate, compressor specific power, and recoverable share. 2. Add each detected leak. 3. Record its location, equipment, and estimated flow from your detection method. 4. Review the estimated annual loss for each leak and the total. 5. Prioritize repairs — leaks with a repair cost are rated by payback. 6. Update the repair status (Open, Planned, Repaired) as work progresses. 7. Print or copy the survey summary. Use Try Example at any time to load a complete sample survey and see the full workflow.",
      },
      {
        title: "How compressed air leak cost is estimated",
        content:
          "Each leak\u2019s flow rate (CFM or L/s) is converted to compressor power using the specific power setting: leak power (kW) = flow (CFM) ÷ 100 × specific power (kW per 100 CFM). Multiplying by annual operating hours (hours per day × days per year) gives the wasted energy in kWh, and multiplying by the electricity rate gives the estimated annual cost. When a repair cost is provided, annual savings are the annual cost multiplied by the recoverable percentage, and payback is repair cost ÷ annual savings. Leaks paying back within 3 months are rated HIGH priority, 3–12 months MEDIUM, over 12 months LOW, and leaks without a repair cost stay Unrated. The repair list is sorted by priority, then by annual savings. These are estimates based on specific power and electricity cost assumptions — actual losses depend on compressor performance, control strategy, and system pressure — so treat them as planning values rather than measured results.",
      },
      {
        title: "Example compressed air leak survey",
        content:
          "Example: a plant survey identifies several leaks across production areas. With default settings (16 h/day, 250 days/year, $0.12/kWh, 18 kW/100 CFM), Leak A — a 12 CFM main line coupling — is estimated at about $933 per year, Leak B — a 6 CFM packaging valve — about $466 per year, and Leak C — an 18 CFM air dryer connection — about $1,244 per year. The tool sums every leak into a total estimated annual loss of roughly $3,800 for the five-leak example survey, rates each repair by payback, and lists the highest-loss leaks first. Click Try Example in the workspace above to load this exact survey.",
        cta: {
          label: "Need to estimate a single leak? Open the Compressed Air Leak Cost Calculator",
          slug: "compressed-air-leak-cost-calculator",
        },
      },
      {
        title: "From leak survey to repair verification",
        content:
          "Finding leaks is only the first step. A real leak program closes the loop: find, record, repair, verify. Each leak in this builder carries a repair status — Open, Planned, or Repaired — so the report always shows both the original estimated annual loss and the remaining open loss. Marking a leak Repaired removes it from the open loss and documents the verification step. This closed-loop tracking is what turns a one-time inspection into an ongoing compressed air leak repair log that maintenance teams and contractors can revisit after every survey.",
      },
    ],
    faq: [
      {
        question: "What is a compressed air leak survey?",
        answer:
          "A systematic walk-through of a compressed air system to locate, tag, measure or estimate, and document every leak, then turn the findings into a total estimated annual loss and a prioritized repair list. It is usually done with an ultrasonic leak detector and repeated on a regular schedule.",
      },
      {
        question: "What should a compressed air leak survey report include?",
        answer:
          "The survey date, facility or area, operating assumptions (hours, electricity rate, specific power), and for each leak: a tag or ID, location, estimated flow, annual cost, repair priority, and repair status. The summary should show the total estimated annual loss, the remaining open loss, and the repair order.",
      },
      {
        question: "How do you document compressed air leaks?",
        answer:
          "Give each leak a unique ID or tag, record where it is and on which equipment, note the estimated flow and your measurement method, estimate the annual cost, assign a repair priority, and track the repair status. Printing or exporting the resulting list gives you a leak log or survey report you can share with maintenance or customers.",
      },
      {
        question: "What information should be recorded for each leak?",
        answer:
          "At minimum: location, estimated leak flow, and repair status. Adding an equipment name, repair cost estimate, and notes makes the log much more useful, because the repair cost is what allows the tool to rate priority by payback.",
      },
      {
        question: "Which leaks should be repaired first?",
        answer:
          "The ones with the shortest payback: repair cost divided by annual savings. Payback of 3 months or less is HIGH priority, 3–12 months is MEDIUM, over 12 months is LOW. Leaks without an estimated repair cost are shown as Unrated until you add one.",
      },
      {
        question: "How often should compressed air leaks be surveyed?",
        answer:
          "New leaks develop continuously as fittings loosen, hoses wear, and equipment changes, so most programs repeat surveys quarterly, with monthly checks in plants that run large or leak-prone systems. Verifying repairs after each round is part of the cycle.",
      },
      {
        question: "Can I use this instead of an Excel leak log?",
        answer:
          "Yes, for most survey workflows. Instead of maintaining a blank spreadsheet or paper leak log sheet, you enter leaks into a structured form and the tool calculates costs, priorities, and the summary automatically. If your team prefers spreadsheets, you can still copy the summary text into one.",
      },
      {
        question: "Does this tool require a specific ultrasonic detector?",
        answer:
          "No. It is vendor-neutral — enter the estimated leak flow from whatever detection method you already use, whether that is an ultrasonic detector of any brand or an estimation method. No device connection is needed.",
      },
      {
        question: "Does UtilRivet store my survey data?",
        answer:
          "No. The tool runs entirely in your browser: survey data is never uploaded or sent to a server, and there is no account. It is also not stored on your device after the session ends, so print or copy the survey summary before closing the page.",
      },
      {
        question: "Does this replace a professional compressed air audit?",
        answer:
          "No. This tool creates estimates and a structured report for maintenance planning. It is not a certified audit or engineering approval. Actual savings depend on compressor performance, system controls, operating conditions, and measured leak flow.",
      },
    ],
  },
  "steam-trap-survey-report-builder": {
    slug: "steam-trap-survey-report-builder",
    subtitle:
      "Record steam traps and their condition, estimate annual steam loss costs, prioritize repairs, and create a printable steam trap survey report.",
    seoSections: [
      {
        title: "What is a Steam Trap Survey?",
        content:
          "A steam trap survey is a systematic inspection of every steam trap in a plant steam system. Each trap is identified, its condition is tested (Good, Leaking, Failed Open, Failed Closed, or Unknown), and the estimated steam loss is recorded. The survey turns individual trap findings into one total annual cost and a prioritized repair list — the foundation of practical steam system maintenance and energy management.",
      },
      {
        title: "Why Do Failed Steam Traps Cost So Much?",
        content:
          "A trap that leaks or fails open discharges live steam continuously. Even a modest loss of 10–30 lb/hr, over thousands of annual operating hours, becomes hundreds of thousands of pounds of lost steam per year. At a typical steam cost of $10–15 per 1,000 lb, a single failing trap can waste more than $1,000 annually — usually far above its repair cost.",
      },
      {
        title: "How Does This Tool Estimate Steam Loss Cost?",
        content:
          "The estimated steam loss (in lb/hr or kg/hr) is entered from your inspection method or survey equipment — the tool does not pretend to simulate trap orifice flow. It multiplies the loss rate by annual operating hours to get pounds of steam lost per year, then values it at your steam cost per 1,000 lb. Traps marked Good, Failed Closed, or Unknown are never counted as recoverable savings automatically.",
      },
      {
        title: "How Are Steam Trap Repairs Prioritized?",
        content:
          "Using a transparent payback rule: repair cost divided by annual savings. Payback of 3 months or less is HIGH priority, 3–12 months is MEDIUM, over 12 months is LOW, and traps without a repair cost are Unrated. Failed Closed and Unknown traps are flagged as Inspection Required because they can create process problems even without a measurable steam loss.",
      },
      {
        title: "What Should a Steam Trap Survey Report Include?",
        content:
          "A useful survey report includes the project and facility details, survey date and technician, operating assumptions, a trap inventory with ID, location, type, condition, loss and repair status, condition counts with a failure rate, total annual loss versus remaining open loss, and a prioritized repair list. This builder assembles all of these sections and lets you copy them as text or print them as a PDF.",
      },
    ],
    faq: [
      {
        question: "What is a steam trap survey?",
        answer:
          "It is a plant-wide inspection where each steam trap is identified, tested, and recorded with its condition and estimated steam loss. The results are summarized into total annual losses and a prioritized repair plan, and the survey is typically repeated on a regular schedule.",
      },
      {
        question: "Does the tool calculate steam loss from trap type and pressure?",
        answer:
          "No. Actual steam loss depends on trap size, orifice size, differential pressure, failure mode, installation and back pressure, so V1 uses the measured or estimated steam loss you enter from your inspection method. The tool focuses on the survey workflow: recording, costing, prioritizing and reporting.",
      },
      {
        question: "How is the annual cost of a failing trap calculated?",
        answer:
          "Steam loss (lb/hr) × annual operating hours = pounds of steam lost per year. Dividing by 1,000 and multiplying by your steam cost per 1,000 lb gives the annual cost loss. Only traps marked Leaking or Failed Open count toward recoverable savings.",
      },
      {
        question: "What does Failed Closed mean for my report?",
        answer:
          "A Failed Closed trap blocks condensate discharge, which can cause water hammer, reduced heat transfer and equipment damage. It is flagged as Inspection Required; the tool does not estimate a dollar loss because the impact is usually a process or reliability issue rather than lost steam.",
      },
      {
        question: "How should trap repairs be prioritized?",
        answer:
          "By payback: repair cost divided by annual savings. Payback of 3 months or less is HIGH, 3–12 months is MEDIUM, over 12 months is LOW. Traps without a repair cost are Unrated, and Failed Closed or Unknown traps are marked Inspection Required.",
      },
      {
        question: "What units are supported?",
        answer:
          "Steam pressure can be entered in psi or bar, and steam loss in lb/hr or kg/hr. Everything is normalized internally to psi and lb/hr, so results are consistent whichever units you use.",
      },
      {
        question: "Can I print the survey as a PDF?",
        answer:
          "Yes. Click Print Report and use your browser's Print to PDF option. The print layout hides buttons and input controls and shows the report header, survey summary, trap inventory, repair priorities, assumptions and disclaimer.",
      },
      {
        question: "Is my survey data uploaded or stored?",
        answer:
          "No. Everything runs locally in your browser. Survey data is kept only in the current page session — nothing is uploaded, stored, or sent to any server.",
      },
      {
        question: "Does this replace a professional steam survey?",
        answer:
          "No. This tool creates preliminary estimates and a structured report for maintenance planning. It is not a certified audit, certified steam survey, or official inspection report. Actual steam loss depends on trap design, orifice size, differential pressure, operating condition, installation and measurement method.",
      },
    ],
  },
  "fixed-fee-matter-profitability-calculator": {
    slug: "fixed-fee-matter-profitability-calculator",
    subtitle:
      "Calculate the true profit, margin, and effective hourly rate of a fixed-fee matter — then estimate what you should charge for a similar matter next time.",
    metaDescription:
      "Calculate profit, margin, effective hourly rate, and a target-margin fee for fixed-fee legal matters. Free browser-based tool with no signup.",
    seoSections: [
      {
        title: "What is matter profitability?",
        content:
          "Matter profitability is the difference between the fixed fee a law firm collects and the real cost of delivering the matter: the hours worked by each team member valued at their internal cost per hour, plus direct costs the firm actually bears. Many fixed-fee practices know what they billed but not what a matter actually earned. A simple profitability review shows the true profit, the profit margin, and the effective hourly rate of the matter — the starting point for better fixed-fee pricing in solo practices and small law firms.",
      },
      {
        title: "How to calculate profit on a fixed-fee matter",
        content:
          "Add up each team member\u2019s hours multiplied by their internal cost per hour to get the labor cost — use internal cost, not the rate billed to the client. Add any direct costs the firm bore on the matter, such as filing fees it absorbed, courier, contract attorney, travel, or research services. Total matter cost is labor cost plus other costs; matter profit is the fixed fee minus total cost, and the profit margin is profit divided by the fixed fee. Enter these figures in the calculator and it produces the full review, including a cost breakdown showing labor, other costs, and profit as a share of the fee.",
      },
      {
        title: "What is effective hourly rate for a fixed-fee matter?",
        content:
          "The effective hourly rate of a fixed-fee matter is the fixed fee divided by the total hours the team actually worked — a revenue-based measure of what each hour of work earned. It is different from profit per hour, which divides matter profit by total hours. If a $3,500 matter took 17.5 total team hours, the effective hourly rate is $200/hour, even if part of that revenue was consumed by labor and other costs. Comparing the effective hourly rate with your internal cost per hour is a quick way to see whether a fixed fee is working for the firm.",
      },
      {
        title: "How to price the next similar matter",
        content:
          "If the next similar matter will cost about the same to deliver, the fee that reaches a target profit margin is: total matter cost ÷ (1 − target margin). A matter that cost $2,200 to deliver needs a fee of about $3,143 to reach a 30% margin. This is a mathematical estimate based on this matter\u2019s actual costs — not market data — so treat it as a starting point for your quote rather than a recommended price.",
      },
      {
        title: "Example fixed-fee matter profitability review",
        content:
          "Example: a firm handles a standard business formation for a fixed fee of $3,500. The partner works 3 hours at an internal cost of $160/hour, an associate 8 hours at $80, and a paralegal 4 hours at $40, giving a labor cost of $1,280 over 15 total hours. The firm also absorbs $300 of filing and admin costs. Total matter cost is $1,580, so matter profit is $1,920 — a 54.9% margin — and the effective hourly rate is $233.33/hour. At a 30% target margin, a similar matter with the same cost would need a calculated target-margin fee of about $2,257. Click Try Example in the workspace above to load this exact matter.",
      },
    ],
    faq: [
      {
        question: "What is matter profitability?",
        answer:
          "It is the difference between the fixed fee collected for a matter and the actual cost of delivering it — team hours at internal cost per hour plus direct costs the firm bore. Reviewing it shows whether a fixed-fee matter was genuinely profitable and at what effective hourly rate.",
      },
      {
        question: "How do you calculate profit on a fixed-fee legal matter?",
        answer:
          "Labor cost is each team member\u2019s hours times their internal cost per hour. Add direct costs the firm bore to get total matter cost, then subtract total cost from the fixed fee. Profit margin is profit divided by the fixed fee.",
      },
      {
        question: "What is an effective hourly rate?",
        answer:
          "The fixed fee divided by total team hours — revenue per hour worked. It is not profit per hour, which divides matter profit by total hours. This tool shows both separately.",
      },
      {
        question: "What costs should I include in a matter profitability review?",
        answer:
          "All labor hours worked on the matter at internal cost per hour, plus direct costs the firm actually bore: filing or admin fees absorbed by the firm, courier, contract attorney, travel, research services, and similar items. Include only costs the firm paid, not amounts billed through to the client.",
      },
      {
        question: "How do I calculate a fee for a target profit margin?",
        answer:
          "Divide the expected total matter cost by (1 − target margin). For example, a matter that costs $1,580 to deliver needs a fee of $1,580 ÷ 0.7 ≈ $2,257 to reach a 30% margin. This assumes the next matter costs about the same as the one you reviewed.",
      },
      {
        question: "Should filing fees be included?",
        answer:
          "Only if the firm actually bore them. If a filing fee was billed through to the client and reimbursed, it is not a cost of the matter. If the firm absorbed it inside the fixed fee, include it in Other Costs.",
      },
      {
        question: "Does UtilRivet store client or matter data?",
        answer:
          "No. The tool runs entirely in your browser: nothing you enter is uploaded, stored on a server, or kept on your device after the session ends. The form does not ask for client names or case details, but you should still avoid entering confidential information.",
      },
      {
        question: "Is this legal or financial advice?",
        answer:
          "No. This tool provides mathematical estimates for internal business analysis. It is not legal, accounting, tax, or financial advice.",
      },
    ],
  },
  "iolta-three-way-reconciliation": {
    slug: "iolta-three-way-reconciliation",
    subtitle:
      "Reconcile an IOLTA trust account three ways — bank statement, trust register and client ledgers — balanced to the cent, then print or save a signed monthly reconciliation record. No account, runs entirely in your browser.",
    metaDescription:
      "Free IOLTA trust account three-way reconciliation tool. Compare bank statement, trust register and client ledger balances to the cent, then print a signed monthly reconciliation record. Runs in your browser, nothing uploaded.",
    seoSections: [
      {
        title: "What is a three-way trust account reconciliation?",
        content:
          "A three-way reconciliation proves that three separate numbers agree to the cent: the adjusted bank balance (the bank statement ending balance minus outstanding checks plus outstanding deposits), the trust register balance, and the total of all individual client ledger balances. Law firms that hold client funds in IOLTA trust accounts typically reconcile monthly, and a three-way reconciliation is the core arithmetic check: if all three figures agree, the bank account, the checkbook register, and the per-client books tell the same story.",
      },
      {
        title: "How to use this reconciliation tool",
        content:
          "Enter the ending balance from your bank statement, then list any checks and deposits that have not yet cleared — these adjust the bank figure. Enter the running trust register balance, then enter each client or matter ledger balance, either one by one or by importing a CSV with Client, Balance on each line. Run the reconciliation: the tool shows whether all three figures agree to the cent and, if not, exactly how far apart they are. You can then add your firm name, period and preparer and print or save the record as a PDF with signature lines.",
      },
      {
        title: "Who is this tool for?",
        content:
          "Solo practitioners and small firms doing their own monthly trust account bookkeeping, bookkeepers preparing reconciliations for attorney review, and anyone who wants a quick arithmetic check without opening an account or moving their ledger into new software. Everything is typed into your browser: nothing is stored, uploaded, or saved on any server, and the CSV import is read locally by your browser only.",
      },
      {
        title: "Is this tool legal advice or a compliance certification?",
        content:
          "No. This tool performs arithmetic only: it adds and compares the three figures you enter and produces a printable record of that comparison. It does not certify compliance with any state bar rule, ABA Model Rule 1.15, or any other requirement, and it does not track state-specific rules. The attorney or bookkeeper using the tool remains responsible for verifying the reconciliation and for knowing the rules that apply in their jurisdiction.",
      },
    ],
    faq: [
      {
        question: "What three figures does a three-way reconciliation compare?",
        answer:
          "The adjusted bank balance (statement ending balance minus outstanding checks plus outstanding deposits), the trust register balance, and the total of all client ledger balances. A balanced trust account is one where all three agree to the cent.",
      },
      {
        question: "What does a negative client ledger balance mean?",
        answer:
          "A negative balance on one client’s ledger can indicate that one client’s funds were used for another client’s matter. The tool accepts negative ledger amounts but always flags them with a warning — even when the three totals still balance — because the cause should be investigated before the record is signed.",
      },
      {
        question: "What CSV format does the import accept?",
        answer:
          "A two-column format with Client in the first column and Balance in the second, with an optional Client, Balance header row. Quoted names like \"Smith, John\" are supported, and balances may use standard negatives such as -250.00 or the accounting form (250.00). Invalid rows are skipped and counted. The file is read locally in your browser and is never uploaded.",
      },
      {
        question: "Do I need to create an account or import my ledger software?",
        answer:
          "No. The tool runs entirely in your browser with no account, no signup, and no connection to Clio, PC Law, QuickBooks, or any other system. You type or import the figures, the math runs locally, and nothing you enter is stored or uploaded.",
      },
      {
        question: "Does this tool certify that my trust account is compliant?",
        answer:
          "No. It provides arithmetic and reconciliation assistance only — not legal advice, and not a compliance certification for any state bar rule or ABA requirement. Verification and compliance remain your responsibility. Rules differ by jurisdiction and change over time; check with your state bar.",
      },
    ],
  },
};

export function getToolContent(slug: string): ToolContent | undefined {
  return toolContents[slug];
}
