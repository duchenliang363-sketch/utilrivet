import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact UtilRivet for feedback, suggestions, or questions.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contact {siteConfig.name}</h1>

      <div className="mt-6 text-sm sm:text-base text-muted leading-relaxed">
        {siteConfig.contactEmail ? (
          <p>
            Email us at:{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="text-primary hover:text-primary-hover underline"
            >
              {siteConfig.contactEmail}
            </a>
          </p>
        ) : (
          <p>Contact form coming soon.</p>
        )}
      </div>
    </main>
  );
}
