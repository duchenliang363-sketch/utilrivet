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
};

export function getToolContent(slug: string): ToolContent | undefined {
  return toolContents[slug];
}
