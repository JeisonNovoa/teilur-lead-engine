import type { LeadState } from "../lib/repo-types";

interface StateBadgeProps {
  state: LeadState;
}

const stateConfig: Record<LeadState, { label: string; bg: string; text: string }> = {
  pending: { label: "Pendiente", bg: "var(--surface-2)", text: "var(--ink-soft)" },
  approved_email: { label: "Email aprobado", bg: "oklch(0.94 0.04 240)", text: "oklch(0.45 0.13 250)" },
  approved_linkedin: { label: "LinkedIn aprobado", bg: "oklch(0.94 0.04 265)", text: "oklch(0.45 0.13 270)" },
  approved_both: { label: "Email + LinkedIn", bg: "oklch(0.94 0.05 290)", text: "oklch(0.45 0.15 295)" },
  rejected: { label: "Rechazado", bg: "var(--surface-2)", text: "var(--ink-faint)" },
  wrong_contact: { label: "Contacto incorrecto", bg: "oklch(0.95 0.05 55)", text: "oklch(0.5 0.13 50)" },
  competitor: { label: "Competidor", bg: "var(--red-bg)", text: "oklch(0.46 0.15 25)" },
  already_contacted: { label: "Ya contactado", bg: "oklch(0.94 0.05 200)", text: "oklch(0.45 0.1 210)" },
  needs_edit: { label: "Necesita edición", bg: "var(--amber-bg)", text: "oklch(0.46 0.11 70)" },
};

export function StateBadge({ state }: StateBadgeProps) {
  const c = stateConfig[state];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
