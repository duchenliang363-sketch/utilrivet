import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "UtilRivet privacy policy. Learn how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted">Last updated: August 2026</p>

      <div className="mt-6 space-y-6 text-sm sm:text-base text-muted leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">Overview</h2>
          <p className="mt-2">
            UtilRivet provides free online tools. This privacy policy explains how we handle information when you use our website.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Information We Collect</h2>
          <p className="mt-2">
            UtilRivet does not create user accounts. We do not actively collect sensitive personal information. Tool calculations are performed in your browser and are not sent to any server.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Analytics</h2>
          <p className="mt-2">
            We may use basic web analytics services to understand how visitors interact with our site. This data is anonymous and used only to improve the website experience.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Cookies</h2>
          <p className="mt-2">
            We may use essential cookies for site functionality. Analytics cookies may be used if analytics services are enabled. No advertising cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Future Changes</h2>
          <p className="mt-2">
            If we add user accounts, payment features, or other services in the future, this privacy policy will be updated accordingly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            For privacy-related questions, please visit our <a href="/contact" className="text-primary hover:text-primary-hover underline">contact page</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
