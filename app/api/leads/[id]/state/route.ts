import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepo, ALL_STATES, type LeadState } from "../../../../../src/dashboard/lib/leads-repo";

const BodySchema = z.object({
  state: z.enum(ALL_STATES as [LeadState, ...LeadState[]]),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/leads/[id]/state
 * Cambia el estado de un lead (aprobar, rechazar, marcar como competidor, etc.).
 * Registra la acción en audit_log automáticamente.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (Number.isNaN(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const repo = getRepo();
  const lead = await repo.getLeadById(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  await repo.updateLeadState(leadId, parsed.data.state, parsed.data.note);

  return NextResponse.json({
    success: true,
    leadId,
    state: parsed.data.state,
  });
}
