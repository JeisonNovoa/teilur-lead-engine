import type { LeadState } from "../lib/leads-repo";

interface StateBadgeProps {
  state: LeadState;
}

const stateLabels: Record<LeadState, string> = {
  pending: "Pendiente",
  approved_email: "Email aprobado",
  approved_linkedin: "LinkedIn aprobado",
  approved_both: "Email + LinkedIn",
  rejected: "Rechazado",
  wrong_contact: "Contacto incorrecto",
  competitor: "Competidor",
  already_contacted: "Ya contactado",
  needs_edit: "Necesita edición",
};

const stateStyles: Record<LeadState, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  approved_email: "bg-blue-100 text-blue-800",
  approved_linkedin: "bg-indigo-100 text-indigo-800",
  approved_both: "bg-violet-100 text-violet-800",
  rejected: "bg-zinc-200 text-zinc-700",
  wrong_contact: "bg-orange-100 text-orange-800",
  competitor: "bg-red-100 text-red-800",
  already_contacted: "bg-cyan-100 text-cyan-800",
  needs_edit: "bg-yellow-100 text-yellow-800",
};

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${stateStyles[state]}`}
    >
      {stateLabels[state]}
    </span>
  );
}
