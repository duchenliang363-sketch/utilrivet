import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-sm text-muted">Page not found.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover transition-colors"
      >
        &larr; Back to home
      </Link>
    </main>
  );
}
