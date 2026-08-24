import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about UtilRivet and our mission to build simple web tools for professionals.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">About</h1>

      <div className="mt-6 space-y-4 text-sm sm:text-base text-muted leading-relaxed">
        <p>
          {siteConfig.name} builds simple web tools for professionals, operators, small businesses, and people who need to get real work done.
        </p>
        <p>
          Our tools are designed to be fast, focused, and easy to use. No sign-ups, no distractions — just open the tool and get the job done.
        </p>
        <p>
          We believe good tools should stay out of your way. That is why we keep every interface clean, every calculation transparent, and every page lightweight.
        </p>
        <p>
          If you have feedback or a tool suggestion, feel free to reach out through our contact page.
        </p>
      </div>
    </main>
  );
}
