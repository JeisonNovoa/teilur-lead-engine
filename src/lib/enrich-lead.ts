import type { LeadInput } from "../types/lead.js";
import type { ApolloClient } from "./apollo-client.js";

export interface EnrichResult {
  lead: LeadInput;
  /** Cuántos endpoints de Apollo se llamaron (para auditar gasto de créditos). */
  enrichmentCallsMade: number;
  /** Si algo falló al enriquecer, se registra aquí. El lead se devuelve igual sin enriquecer. */
  error?: string;
}

/**
 * Enriquece un solo lead llamando a Apollo:
 * - people/match → email del contacto + LinkedIn
 * - organizations/enrich → industria, tamaño, descripción, ubicación
 *
 * Si el lead YA tiene email + datos de empresa, se salta el enriquecimiento.
 * Si solo falta uno de los dos, solo llama al endpoint correspondiente.
 *
 * Devuelve el lead enriquecido (campos completados con la data nueva).
 * ⚠️ Cada llamada consume créditos del plan de Apollo.
 */
export async function enrichLead(
  lead: LeadInput,
  apollo: ApolloClient,
): Promise<EnrichResult> {
  let enriched = { ...lead };
  let callsMade = 0;
  const errors: string[] = [];

  // --- 1. Enriquecer persona (sacar email + LinkedIn) ---
  const needsPersonEnrich = !lead.contactEmail || !lead.contactLinkedin;
  const personId = lead.raw?.apollo_person_id;
  if (needsPersonEnrich && personId) {
    try {
      const person = await apollo.enrichPerson({ id: personId });
      callsMade += 1;
      if (person) {
        enriched = {
          ...enriched,
          contactEmail: enriched.contactEmail || person.email || undefined,
          contactLinkedin: enriched.contactLinkedin || person.linkedin_url || undefined,
          contactTitle: enriched.contactTitle || person.title || undefined,
        };
      }
    } catch (err) {
      errors.push(`enrichPerson: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // --- 2. Enriquecer organización (industria, tamaño, descripción, ubicación) ---
  const needsOrgEnrich =
    !lead.industry || !lead.employeeCount || !lead.companyDescription || !lead.companyLocation;

  // Necesitamos un dominio para llamar a organizations/enrich
  const domain = extractDomain(enriched.website);

  if (needsOrgEnrich && domain) {
    try {
      const org = await apollo.enrichOrganization(domain);
      callsMade += 1;
      if (org) {
        const orgLocation = [org.city, org.state, org.country].filter(Boolean).join(", ") || undefined;
        enriched = {
          ...enriched,
          website: enriched.website || org.website_url || org.primary_domain || undefined,
          industry: enriched.industry || org.industry || undefined,
          employeeCount: enriched.employeeCount || (org.estimated_num_employees ? String(org.estimated_num_employees) : undefined),
          companyLocation: enriched.companyLocation || orgLocation,
          companyLinkedin: enriched.companyLinkedin || org.linkedin_url || undefined,
          companyDescription: enriched.companyDescription || org.short_description || undefined,
        };
      }
    } catch (err) {
      errors.push(`enrichOrganization: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    lead: enriched,
    enrichmentCallsMade: callsMade,
    error: errors.length > 0 ? errors.join(" | ") : undefined,
  };
}

/**
 * Extrae el dominio limpio de una URL o string tipo "acme.io".
 * Devuelve null si no hay nada utilizable.
 */
function extractDomain(websiteOrDomain: string | undefined): string | null {
  if (!websiteOrDomain) return null;
  const cleaned = websiteOrDomain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
  // Validación mínima: tiene que tener al menos un punto y una extensión válida
  if (!cleaned.includes(".") || cleaned.length < 4) return null;
  return cleaned;
}
