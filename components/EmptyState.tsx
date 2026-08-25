import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  hint: string;
  action?: ReactNode;
}

/**
 * EmptyState — small icon, title, one line of help and an optional CTA.
 * Deliberately quiet: no large illustrations.
 */
export default function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong/70 px-6 py-10 text-center">
      <svg
        className="mx-auto h-5 w-5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[13px] text-muted">{hint}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
