import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to contact UtilRivet for feedback or questions about the tools.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contact {siteConfig.name}</h1>

      <div className="mt-6 space-y-4 text-sm sm:text-base text-muted leading-relaxed">
        {siteConfig.contactEmail ? (
          <p>
            Email:{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="text-primary hover:text-primary-hover underline"
            >
              {siteConfig.contactEmail}
            </a>
          </p>
        ) : (
          <p>
            A public contact email is not listed yet. Do not send survey files or plant data to this
            page — current tools keep that data in your browser until you export it yourself.
          </p>
        )}
        <p>There is no phone number, office address, or contact form on this site.</p>
      </div>
    </main>
  );
}
