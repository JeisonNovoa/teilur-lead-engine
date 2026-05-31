"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

/**
 * Botón pequeño que copia texto al portapapeles.
 * Muestra "Copiado" durante 2s después de copiar.
 */
export function CopyButton({ text, label = "Copiar" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso si el navegador no permite clipboard
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-3 py-1 rounded-md transition-colors"
    >
      {copied ? "✓ Copiado" : label}
    </button>
  );
}
