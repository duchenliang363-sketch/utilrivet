const iconProps = {
  className: "h-4 w-4 shrink-0 text-gray-400",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.5,
};

const items = [
  {
    label: "No signup",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
      </svg>
    ),
  },
  {
    label: "Runs in your browser",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M3 9h18" />
      </svg>
    ),
  },
  {
    label: "Fast & focused",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />
      </svg>
    ),
  },
  {
    label: "Privacy-friendly",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
      </svg>
    ),
  },
];

/**
 * TrustStrip — very light trust row below the hero.
 * Horizontal on desktop, 2×2 on mobile.
 */
export default function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-center gap-2 text-[13px] font-medium text-gray-600 sm:justify-start">
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
