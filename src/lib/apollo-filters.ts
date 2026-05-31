/**
 * Filtros de búsqueda de Apollo para Teilur Talent.
 *
 * Definidos según el cliente ideal que indicó Melanie:
 * - Decision makers: CTO, CEO, SVP Engineering, Co-founder, Founder, CRO
 * - Tamaño de empresa: cualquiera (algunos pequeños/medianos/grandes igual necesitan)
 * - Industrias: tecnología, medios, startups, healthcare, deportes, entretenimiento
 *   (todas funcionan siempre que necesiten ingenieros)
 * - Lo más importante: que estén CONTRATANDO ingenieros (software, ciberseguridad, etc.)
 *
 * Si Melanie cambia el criterio, se ajusta AQUÍ (y se actualiza docs/04-CALIFICACION-LEADS.md).
 */

/**
 * Títulos de decision makers que queremos encontrar.
 * Apollo busca por partial match (a menos que include_similar_titles=false).
 */
export const DECISION_MAKER_TITLES: string[] = [
  "CTO",
  "Chief Technology Officer",
  "CEO",
  "Chief Executive Officer",
  "SVP Engineering",
  "Senior Vice President of Engineering",
  "VP Engineering",
  "Vice President of Engineering",
  "Co-Founder",
  "Founder",
  "CRO",
  "Chief Revenue Officer",
];

/**
 * Niveles de seniority válidos en Apollo (valores fijos).
 * Filtramos por estos para evitar caer en recruiters junior.
 */
export const SENIORITIES: string[] = [
  "owner",
  "founder",
  "c_suite",
  "partner",
  "vp",
];

/**
 * Ubicaciones del cliente objetivo (US + Canada).
 * Apollo acepta nombres de países o estados/ciudades.
 */
export const ORGANIZATION_LOCATIONS: string[] = ["United States", "Canada"];

/**
 * Títulos de vacantes ABIERTAS que la empresa target debe tener publicadas.
 * Esto es lo más importante según Melanie: que estén contratando ingenieros.
 *
 * El filtro q_organization_job_titles[] hace que solo aparezcan empresas
 * que TIENEN vacantes abiertas con estos títulos.
 */
export const OPEN_JOB_TITLES: string[] = [
  "Software Engineer",
  "Senior Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Security Engineer",
  "Cybersecurity Engineer",
  "QA Engineer",
  "Mobile Engineer",
];

/**
 * Mínimo de vacantes abiertas que debe tener la empresa para considerarla.
 * 1 = al menos una vacante. Si quieres más estricto, sube a 2 o 3.
 */
export const MIN_OPEN_JOBS = 1;

/**
 * Construye el body para POST /v1/mixed_people/api_search.
 * Cada llamada devuelve hasta `perPage` personas (máx 100).
 *
 * Nota: este endpoint NO consume créditos del plan de Apollo.
 * Los créditos se gastan al enriquecer (sacar email) en otro endpoint.
 */
export interface ApolloSearchBody {
  person_titles?: string[];
  person_seniorities?: string[];
  organization_locations?: string[];
  q_organization_job_titles?: string[];
  organization_num_jobs_range?: { min?: number; max?: number };
  page?: number;
  per_page?: number;
  contact_email_status?: string[];
}

export function buildDefaultSearchBody(page = 1, perPage = 25): ApolloSearchBody {
  return {
    person_titles: DECISION_MAKER_TITLES,
    person_seniorities: SENIORITIES,
    organization_locations: ORGANIZATION_LOCATIONS,
    q_organization_job_titles: OPEN_JOB_TITLES,
    organization_num_jobs_range: { min: MIN_OPEN_JOBS },
    // Solo personas con email verificado o "likely to engage"
    contact_email_status: ["verified", "likely to engage"],
    page,
    per_page: perPage,
  };
}
