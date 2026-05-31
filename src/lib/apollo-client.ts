import { buildDefaultSearchBody, type ApolloSearchBody } from "./apollo-filters.js";

const APOLLO_BASE_URL = "https://api.apollo.io";
const SEARCH_ENDPOINT = "/api/v1/mixed_people/api_search";
const PEOPLE_MATCH_ENDPOINT = "/api/v1/people/match";
const ORG_ENRICH_ENDPOINT = "/api/v1/organizations/enrich";

/**
 * Forma parcial de una persona devuelta por Apollo en mixed_people/api_search.
 * Solo declaramos los campos que usamos; Apollo devuelve muchos más.
 */
export interface ApolloPerson {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  headline?: string;
  email?: string;
  email_status?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: ApolloOrganization;
}

export interface ApolloOrganization {
  id: string;
  name?: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  estimated_num_employees?: number;
  short_description?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface ApolloSearchResponse {
  people?: ApolloPerson[];
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

/**
 * Respuesta del endpoint people/match (enriquecimiento de persona).
 * Devuelve datos demográficos y firmográficos completos incluyendo email.
 */
interface ApolloPersonMatchResponse {
  person?: ApolloPerson;
}

/**
 * Respuesta del endpoint organizations/enrich.
 * Devuelve datos completos de la empresa: industria, tamaño, descripción, etc.
 */
interface ApolloOrganizationEnrichResponse {
  organization?: ApolloOrganization;
}

/**
 * Parámetros para enriquecer una persona. Debe pasar al menos uno de:
 * - id (Apollo person id, lo más confiable)
 * - email
 * - linkedin_url
 * - name + organization domain
 */
export interface EnrichPersonParams {
  id?: string;
  email?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  domain?: string;
  /** Si true, Apollo revela el email aunque sea premium (consume créditos extra). */
  revealPersonalEmails?: boolean;
}

export interface ApolloClientOptions {
  apiKey: string;
}

/**
 * Cliente delgado para la API de Apollo.
 * - Usa POST con header `X-Api-Key` (formato que Apollo recomienda actualmente).
 * - Maneja errores con mensajes claros (no devolver "Error 401" sin contexto).
 * - El endpoint de búsqueda NO consume créditos del plan.
 */
export class ApolloClient {
  private readonly apiKey: string;

  constructor(options: ApolloClientOptions) {
    if (!options.apiKey) {
      throw new Error(
        "Falta APOLLO_API_KEY en el archivo .env.\n" +
          "Consíguela en Apollo > Settings > Integrations > API.",
      );
    }
    this.apiKey = options.apiKey;
  }

  /**
   * Una sola página de búsqueda. Devuelve la lista de personas + metadata de paginación.
   */
  async searchPeople(body: ApolloSearchBody): Promise<ApolloSearchResponse> {
    const response = await fetch(`${APOLLO_BASE_URL}${SEARCH_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Apollo API respondió ${response.status} ${response.statusText}.\n` +
          `Detalle: ${text.slice(0, 500)}\n` +
          (response.status === 401
            ? "→ Revisa que APOLLO_API_KEY sea correcta y tenga permiso para 'mixed_people/search'."
            : response.status === 422
              ? "→ Algún filtro tiene formato inválido. Revisa apollo-filters.ts."
              : ""),
      );
    }

    return (await response.json()) as ApolloSearchResponse;
  }

  /**
   * Enriquece una persona — devuelve email, LinkedIn, teléfono y datos de la empresa.
   * ⚠️ Consume créditos del plan de Apollo.
   *
   * El parámetro más confiable es `id` (Apollo person id) si lo tienes de una
   * búsqueda previa. Si no, se puede usar email, linkedin_url, o nombre+dominio.
   */
  async enrichPerson(params: EnrichPersonParams): Promise<ApolloPerson | null> {
    const body: Record<string, unknown> = {};
    if (params.id) body.id = params.id;
    if (params.email) body.email = params.email;
    if (params.linkedinUrl) body.linkedin_url = params.linkedinUrl;
    if (params.firstName) body.first_name = params.firstName;
    if (params.lastName) body.last_name = params.lastName;
    if (params.organizationName) body.organization_name = params.organizationName;
    if (params.domain) body.domain = params.domain;
    if (params.revealPersonalEmails) body.reveal_personal_emails = true;

    const response = await fetch(`${APOLLO_BASE_URL}${PEOPLE_MATCH_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Apollo people/match respondió ${response.status} ${response.statusText}. ` +
          `Detalle: ${text.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as ApolloPersonMatchResponse;
    return data.person ?? null;
  }

  /**
   * Enriquece una organización por su dominio (sin "www." ni "@").
   * Devuelve industria, tamaño, descripción, ubicación y más.
   * ⚠️ Consume créditos del plan de Apollo.
   */
  async enrichOrganization(domain: string): Promise<ApolloOrganization | null> {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    const url = `${APOLLO_BASE_URL}${ORG_ENRICH_ENDPOINT}?domain=${encodeURIComponent(cleanDomain)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Api-Key": this.apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Apollo organizations/enrich respondió ${response.status} ${response.statusText}. ` +
          `Detalle: ${text.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as ApolloOrganizationEnrichResponse;
    return data.organization ?? null;
  }

  /**
   * Busca personas usando los filtros por defecto de Teilur (Melanie) y pagina
   * automáticamente hasta alcanzar `maxResults`.
   *
   * Devuelve un array de ApolloPerson listo para mapear a LeadInput.
   */
  async searchWithDefaults(maxResults: number): Promise<ApolloPerson[]> {
    const perPage = Math.min(100, maxResults);
    const collected: ApolloPerson[] = [];
    let page = 1;

    while (collected.length < maxResults) {
      const body = buildDefaultSearchBody(page, perPage);
      const result = await this.searchPeople(body);
      const people = result.people ?? [];

      if (people.length === 0) break;

      for (const person of people) {
        if (collected.length >= maxResults) break;
        collected.push(person);
      }

      const totalPages = result.pagination?.total_pages ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }

    return collected;
  }
}
