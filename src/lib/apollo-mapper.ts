import type { LeadInput } from "../types/lead.js";
import type { ApolloPerson } from "./apollo-client.js";

/**
 * Convierte una persona de Apollo al formato LeadInput que entiende el calificador.
 * Hace lo mismo que el lector de CSV, pero con la respuesta JSON de la API.
 *
 * Solo descarta personas sin nombre de empresa (no se pueden calificar).
 */
export function apolloPersonToLead(person: ApolloPerson): LeadInput | null {
  const org = person.organization;
  if (!org?.name) return null;

  const contactName =
    person.name ||
    [person.first_name, person.last_name].filter(Boolean).join(" ").trim() ||
    undefined;

  const contactLocation = [person.city, person.state, person.country]
    .filter(Boolean)
    .join(", ") || undefined;
  const companyLocation = [org.city, org.state, org.country]
    .filter(Boolean)
    .join(", ") || undefined;

  return {
    companyName: org.name,
    website: org.website_url || org.primary_domain || undefined,
    industry: org.industry || undefined,
    employeeCount: org.estimated_num_employees
      ? String(org.estimated_num_employees)
      : undefined,
    companyLocation,
    companyLinkedin: org.linkedin_url || undefined,
    companyDescription: org.short_description || undefined,
    contactName,
    contactTitle: person.title || person.headline || undefined,
    contactEmail: person.email || undefined,
    contactLinkedin: person.linkedin_url || undefined,
    source: "apollo-search",
    raw: buildRawDebugInfo(person, contactLocation),
  };
}

/**
 * Snapshot mínimo de la respuesta de Apollo para debug/auditoría
 * (sin guardar todo el objeto que puede ser muy grande).
 */
function buildRawDebugInfo(
  person: ApolloPerson,
  contactLocation: string | undefined,
): Record<string, string> {
  const raw: Record<string, string> = {
    apollo_person_id: person.id,
  };
  if (person.email_status) raw.email_status = person.email_status;
  if (contactLocation) raw.contact_location = contactLocation;
  if (person.organization?.id) raw.apollo_org_id = person.organization.id;
  return raw;
}

/**
 * Convierte un array completo descartando entradas inválidas.
 * Devuelve los leads válidos y el número de descartados.
 */
export function apolloPeopleToLeads(people: ApolloPerson[]): {
  leads: LeadInput[];
  skipped: number;
} {
  const leads: LeadInput[] = [];
  let skipped = 0;
  for (const person of people) {
    const lead = apolloPersonToLead(person);
    if (lead) leads.push(lead);
    else skipped += 1;
  }
  return { leads, skipped };
}
