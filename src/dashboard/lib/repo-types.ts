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

/**
 * Contrato común que cumplen tanto la implementación SQLite (local) como
 * la de Postgres (Supabase/nube). El resto de la app solo conoce esta interfaz,
 * así que cambiar de motor de DB no afecta a las páginas ni a los CLIs.
 */
export interface LeadsRepo {
  upsertLead(lead: QualifiedLead): Promise<number>;
  listLeads(filters?: ListLeadsFilters): Promise<LeadRow[]>;
  getLeadById(id: number): Promise<LeadRow | null>;
  updateLeadState(leadId: number, newState: LeadState, note?: string): Promise<void>;
  getStats(): Promise<LeadStats>;
}
