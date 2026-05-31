"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadState } from "../lib/leads-repo";

interface ActionButtonsProps {
  leadId: number;
  currentState: LeadState;
}

interface ActionConfig {
  state: LeadState;
  label: string;
  className: string;
  emoji: string;
}

const POSITIVE_ACTIONS: ActionConfig[] = [
  { state: "approved_both", label: "Aprobar email + LinkedIn", className: "bg-violet-600 text-white hover:bg-violet-700", emoji: "✓" },
  { state: "approved_email", label: "Solo email", className: "bg-blue-600 text-white hover:bg-blue-700", emoji: "✉" },
  { state: "approved_linkedin", label: "Solo LinkedIn", className: "bg-indigo-600 text-white hover:bg-indigo-700", emoji: "in" },
];

const NEGATIVE_ACTIONS: ActionConfig[] = [
  { state: "rejected", label: "Rechazar", className: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200", emoji: "✕" },
  { state: "wrong_contact", label: "Contacto incorrecto", className: "bg-orange-100 text-orange-800 hover:bg-orange-200", emoji: "?" },
  { state: "competitor", label: "Es competidor", className: "bg-red-100 text-red-800 hover:bg-red-200", emoji: "!" },
  { state: "already_contacted", label: "Ya contactado", className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200", emoji: "✓" },
  { state: "needs_edit", label: "Necesita edición", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200", emoji: "✎" },
];

export function ActionButtons({ leadId, currentState }: ActionButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function updateState(newState: LeadState) {
    setError(null);
    const response = await fetch(`/api/leads/${leadId}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Error desconocido" }));
      setError(data.error ?? "No se pudo actualizar.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-zinc-600 mb-2 font-medium">Aprobar</div>
        <div className="flex flex-wrap gap-2">
          {POSITIVE_ACTIONS.map((action) => (
            <button
              key={action.state}
              type="button"
              disabled={pending || currentState === action.state}
              onClick={() => updateState(action.state)}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.className}`}
            >
              <span className="mr-1">{action.emoji}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-zinc-600 mb-2 font-medium">Descartar / marcar</div>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_ACTIONS.map((action) => (
            <button
              key={action.state}
              type="button"
              disabled={pending || currentState === action.state}
              onClick={() => updateState(action.state)}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.className}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {currentState !== "pending" && (
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => updateState("pending")}
            className="text-xs text-zinc-500 hover:text-zinc-700 underline disabled:opacity-50"
          >
            Volver a pendiente
          </button>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
