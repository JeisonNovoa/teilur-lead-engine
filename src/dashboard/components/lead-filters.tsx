"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

const FIT_OPTIONS = [
  { value: "", label: "Verdes y Amarillos" },
  { value: "Green", label: "Solo Verdes" },
  { value: "Yellow", label: "Solo Amarillos" },
  { value: "Red", label: "Solo Rojos" },
  { value: "all", label: "Todos los fits" },
];

const STATE_OPTIONS = [
  { value: "pending", label: "Pendientes" },
  { value: "approved_email", label: "Email aprobado" },
  { value: "approved_linkedin", label: "LinkedIn aprobado" },
  { value: "approved_both", label: "Email + LinkedIn" },
  { value: "already_contacted", label: "Ya contactado" },
  { value: "rejected", label: "Rechazados" },
  { value: "all", label: "Todos los estados" },
];

/**
 * Filtros del inbox. Aplican automáticamente al cambiar (sin botón "Aplicar").
 * La búsqueda usa debounce para no recargar en cada tecla.
 */
export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const fit = searchParams.get("fit") ?? "";
  const state = searchParams.get("state") ?? "pending";

  function applyParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  // Debounce de la búsqueda: aplica 350ms después de dejar de escribir
  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => applyParam("search", search.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[220px] relative">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)] mb-1.5">
          Buscar
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-faint)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Empresa o contacto…"
            className="field w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      <FilterSelect
        label="Fit"
        value={fit}
        options={FIT_OPTIONS}
        onChange={(v) => applyParam("fit", v)}
      />
      <FilterSelect
        label="Estado"
        value={state}
        options={STATE_OPTIONS}
        onChange={(v) => applyParam("state", v === "pending" ? "" : v)}
      />

      {isPending && (
        <span className="text-xs text-[var(--ink-faint)] pb-2">Actualizando…</span>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)] mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
