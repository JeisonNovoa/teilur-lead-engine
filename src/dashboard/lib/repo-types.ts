import type { LeadInput, Qualification, QualifiedLead } from "../../types/lead";

/** Estados posibles de un lead en el dashboard. */
export type LeadState =
  | "pending"
  | "approved_email"
  | "approved_linkedin"
  | "approved_both"
  | "rejected"
  | "wrong_contact"
  | "competitor"
  | "already_contacted"
  | "needs_edit";

export const ALL_STATES: LeadState[] = [
  "pending",
  "approved_email",
  "approved_linkedin",
  "approved_both",
  "rejected",
  "wrong_contact",
  "competitor",
  "already_contacted",
  "needs_edit",
];

export interface LeadRow {
  id: number;
  apolloPersonId: string | null;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  fitClassification: "Green" | "Yellow" | "Red";
  score: number;
  isCompetitor: boolean;
  source: string;
  model: string;
  input: LeadInput;
  qualification: Qualification;
  processedAt: string;
  createdAt: string;
  state: LeadState;
  stateNote: string | null;
  stateUpdatedAt: string | null;
}

export interface ListLeadsFilters {
  fit?: "Green" | "Yellow" | "Red" | "all";
  state?: LeadState | "all";
  search?: string;
  limit?: number;
}

export interface LeadStats {
  total: number;
  byFit: { Green: number; Yellow: number; Red: number };
  byState: Record<LeadState, number>;
}

/** Helper: objeto con todos los estados en 0 (para inicializar conteos). */
export function emptyStateCounts(): Record<LeadState, number> {
  return {
    pending: 0,
    approved_email: 0,
    approved_linkedin: 0,
    approved_both: 0,
    rejected: 0,
    wrong_contact: 0,
    competitor: 0,
    already_contacted: 0,
    needs_edit: 0,
  };
}

/**
 * Contrato del repositorio de leads (implementado sobre Postgres / Supabase).
 * El resto de la app solo conoce esta interfaz.
 */
export interface LeadsRepo {
  upsertLead(lead: QualifiedLead): Promise<number>;
  listLeads(filters?: ListLeadsFilters): Promise<LeadRow[]>;
  getLeadById(id: number): Promise<LeadRow | null>;
  updateLeadState(leadId: number, newState: LeadState, note?: string): Promise<void>;
  getStats(): Promise<LeadStats>;
  /**
   * Actualiza los datos enriquecidos de un lead (input + qualification) sin
   * tocar su estado. Se usa al re-enriquecer leads existentes.
   */
  updateLeadData(leadId: number, lead: QualifiedLead): Promise<void>;
}
