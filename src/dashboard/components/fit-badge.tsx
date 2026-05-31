interface FitBadgeProps {
  fit: "Green" | "Yellow" | "Red";
}

/**
 * Badge de color para el fit. Mismo lenguaje visual que el CSV.
 */
export function FitBadge({ fit }: FitBadgeProps) {
  const styles = {
    Green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    Yellow: "bg-amber-100 text-amber-800 ring-amber-200",
    Red: "bg-red-100 text-red-800 ring-red-200",
  } as const;
  const labels = { Green: "Verde", Yellow: "Amarillo", Red: "Rojo" } as const;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${styles[fit]}`}
    >
      {labels[fit]}
    </span>
  );
}
