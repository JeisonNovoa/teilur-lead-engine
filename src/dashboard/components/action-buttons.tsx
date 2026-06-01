"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadState } from "../lib/repo-types";

interface ActionButtonsProps {
  leadId: number;
  currentState: LeadState;
}

interface ActionConfig {
  state: LeadState;
  label: string;
  style: React.CSSProperties;
}

const APPROVE: ActionConfig[] = [
  { state: "approved_both", label: "Aprobar email + LinkedIn", style: { background: "var(--brand)", color: "white" } },
  { state: "approved_email", label: "Solo email", style: { background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border-strong)" } },
  { state: "approved_linkedin", label: "Solo LinkedIn", style: { background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border-strong)" } },
];

const DISCARD: { state: LeadState; label: string }[] = [
  { state: "already_contacted", label: "Ya contactado" },
  { state: "wrong_contact", label: "Contacto incorrecto" },
  { state: "competitor", label: "Competidor" },
  { state: "rejected", label: "Rechazar" },
];

export function ActionButtons({ leadId, currentState }: ActionButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<LeadState>(currentState);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function updateState(newState: LeadState) {
    setError(null);
    setOptimistic(newState); // feedback inmediato
    const res = await fetch(`/api/leads/${leadId}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    });
    if (!res.ok) {
      setOptimistic(currentState);
      const data = await res.json().catch(() => ({ error: "Error" }));
      setError(data.error ?? "No se pudo actualizar.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {APPROVE.map((a) => (
          <button
            key={a.state}
            type="button"
            disabled={pending}
            onClick={() => updateState(a.state)}
            style={a.style}
            className={`w-full text-sm font-medium py-2.5 rounded-lg transition-all hover:shadow-[var(--shadow-md)] disabled:opacity-60 ${
              optimistic === a.state ? "ring-2 ring-offset-1 ring-[var(--brand)]" : ""
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {DISCARD.map((a) => (
          <button
            key={a.state}
            type="button"
            disabled={pending}
            onClick={() => updateState(a.state)}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
              optimistic === a.state
                ? "bg-[var(--red-bg)] text-[oklch(0.46_0.15_25)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {optimistic !== "pending" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => updateState("pending")}
          className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink-soft)] underline disabled:opacity-60"
        >
          Volver a pendiente
        </button>
      )}

      {error && (
        <div className="text-xs text-[oklch(0.5_0.15_25)] bg-[var(--red-bg)] rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
