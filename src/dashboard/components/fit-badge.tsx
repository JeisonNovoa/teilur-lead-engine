interface FitBadgeProps {
  fit: "Green" | "Yellow" | "Red";
  size?: "sm" | "md";
}

const config = {
  Green: { label: "Verde", dot: "var(--green)", bg: "var(--green-bg)", text: "oklch(0.4 0.12 150)" },
  Yellow: { label: "Amarillo", dot: "var(--amber)", bg: "var(--amber-bg)", text: "oklch(0.46 0.11 70)" },
  Red: { label: "Rojo", dot: "var(--red)", bg: "var(--red-bg)", text: "oklch(0.46 0.15 25)" },
} as const;

/** Pastilla de fit con punto de color. Lenguaje visual de semáforo. */
export function FitBadge({ fit, size = "md" }: FitBadgeProps) {
  const c = config[fit];
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad}`}
      style={{ background: c.bg, color: c.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}
