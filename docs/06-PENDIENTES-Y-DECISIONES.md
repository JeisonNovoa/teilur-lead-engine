# Pendientes y Decisiones

> **Última actualización:** 2026-05-22
> Este archivo se mantiene vivo: cuando algo se decide o cambia, se actualiza aquí.

---

## Preguntas pendientes para Melanie

| # | Pregunta | Por qué importa | Estado |
|---|---|---|---|
| 1 | ¿Cuántos leads procesa por semana actualmente? | Define volumen y si Apollo Basic alcanza | ⏳ Pendiente |
| 2 | ¿Apollo es plan pagado o free? | El free tiene solo 100 créditos/mes (insuficiente) | ✅ Confirmado: plan Basic $49/mes |
| 3 | ¿Desde qué dominio envían cold emails? | Nunca usar el dominio principal `teilurtalent.com` (riesgo de quemar reputación) | ⏳ Pendiente |
| 4 | ¿Tienen dominio secundario para cold email? | Necesario para envíos en volumen con warm-up | ⏳ Pendiente |
| 5 | ¿HubSpot ya tiene datos o está vacío? | Define si hay que importar/limpiar | ⏳ Pendiente |
| 6 | ¿Presupuesto mensual máximo aceptable? | Buscar opciones más baratas si es ajustado | ⏳ Pendiente |
| 7 | Filtros del cliente ideal (titles, industrias, tamaño) | Configurar la búsqueda automatizada | ✅ Confirmado: ver `src/lib/apollo-filters.ts` |

---

## Decisiones tomadas

| Decisión | Elección | Razón |
|---|---|---|
| ¿Automatizar LinkedIn? | **NO** | Riesgo de baneo de cuenta |
| Modelo IA para calificar | **Gemini 2.5 Flash** | Más barato, 97% calidad |
| Modelo IA para redactar | **Claude Haiku 4.5** | Mejor redacción y JSON estructurado |
| Orquestador | **n8n self-hosted** (o Make Core) | Ilimitado y nativo IA; Make si quieren visual sin servidor |
| CRM | **HubSpot Free** | Ya lo tienen, suficiente al inicio |
| Cold email | **Apollo Sequences** primero | Ya incluido; Instantly solo si falla |
| Wellfound | **Apify** en Fase 2 | Solo si Apollo no da suficientes leads |
| Dashboard | **Código propio** (dev del equipo) | Más barato/flexible que Retool/Airtable |
| Quién construye | **Dev del equipo de Teilur** | Confirmado: hay dev disponible |

---

## Decisiones abiertas (a definir con el dev)

| Tema | Opciones | Notas |
|---|---|---|
| Orquestador final | n8n self-hosted vs Make Core | Depende de si el dev quiere manejar servidor |
| Stack del dashboard | Next.js / otro | El dev decide según experiencia |
| Hosting | Railway / Render / DigitalOcean | El dev decide |
| ¿Un modelo IA o dos? | Solo Gemini vs Gemini+Claude | Empezar con dos; simplificar a uno si conviene |

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Baneo de LinkedIn por automatización | LinkedIn siempre manual |
| Quemar reputación del dominio de email | Usar dominio secundario + warm-up + validación |
| Apify scraper se rompe si Wellfound cambia HTML | Apollo como fuente principal de respaldo |
| Bounce rate alto en emails | Validación con Apollo / NeverBounce |
| Apollo en plan free (créditos insuficientes) | Confirmar plan con Melanie (pendiente #2) |
| IA califica mal al inicio | Validar en Fase 1 antes de construir todo |
| Compliance CAN-SPAM / GDPR | Opt-out, no mentir, pausar ante "unsubscribe" |

---

## Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-05-22 | Creación inicial de toda la documentación |
| 2026-05-22 | **Fase 1 construida.** Stack: Node.js + TypeScript. IA: solo Gemini 2.5 Flash (`@google/genai` v2.6). Entrada: CSV de Apollo (con estructura lista para API después). Calificador CLI funcionando: lee CSV → califica con IA → exporta CSV/JSON ordenado por fit. Tests del lector de CSV pasando. Ver `README.md`. |
| 2026-05-26 | **Confirmado:** Melanie NO busca en Apollo — usa LinkedIn y Wellfound manualmente, y Apollo solo para enriquecer (email/teléfono). LinkedIn queda **manual** (riesgo de ban con bots; LinkedIn Partner API cerrada en 2026). Apollo Search API es la fuente automatizada principal porque cubre los mismos contactos que Melanie buscaba en LinkedIn. |
| 2026-05-26 | **Fuentes definidas (todas gratis o ya pagadas):** Apollo Search API (ya pagado, plan Basic $49); Wellfound vía Apify (free tier $5/mes cubre 10k resultados); Hacker News "Who is Hiring" (gratis). Google Jobs API descartada (cerrada 2021). Indeed API descartada (solo partners). |
| 2026-05-26 | **Filtros de Teilur confirmados por Melanie:** decision makers = CTO/CEO/SVP Eng/Co-founder/Founder/CRO. Tamaño: cualquiera. Industrias: todas siempre que necesiten ingenieros. Lo clave: **vacantes abiertas de engineering**. Codificados en `src/lib/apollo-filters.ts`. |
| 2026-05-26 | **Cliente de Apollo Search API construido.** Nuevo comando `npm run search` busca leads directamente en Apollo (sin créditos consumidos en búsqueda) y los califica con IA. Endpoint: `POST /api/v1/mixed_people/api_search`. |
| 2026-05-29 | **Doble pasada implementada.** Pre-calificación rápida (triage sin mensajes) → enriquecimiento solo de Verdes/Amarillos → calificación completa con mensajes. Ahorra créditos Apollo (rojos descartados) y tokens IA (no genera mensajes para Rojos). |
| 2026-05-29 | **Modelo IA: Gemini 3.1 Flash Lite (preview).** Mejor calidad de redacción, 40% más barato y 64% más rápido que 2.5 Flash. Costo despreciable. |
| 2026-05-29 | **Doble output: CSV limpio para Melanie + CSV de auditoría.** El archivo principal solo tiene Verdes/Amarillos (lo accionable). El de auditoría incluye Rojos para verificar que la IA descarta bien. |
| 2026-05-29 | **Feedback de Melanie validado.** De 10 leads probados: la IA detectó bien Rippling (EOR) y Publicis Sapient (consultora) como Rojos. Confusión de Melanie con Poshmark/Zscaler fue un typo (confundió con "Zcaler"). Se confía en el criterio de la IA. |
| 2026-05-29 | **Fase 2 MVP construido.** Dashboard local con Next.js 15 + Tailwind + SQLite. Vistas: inbox con filtros, detalle de lead con mensajes copiables, acciones (aprobar email/LinkedIn/ambos, rechazar, marcar competidor, etc.). Decisión: hosting local primero, sin Slack ni HubSpot integration aún (validar primero el flujo de revisión). |
| 2026-05-29 | **Deploy: Vercel + Supabase elegido.** Postgres robusto + auth incluido para crecer. Capa de DB agnóstica: el sistema usa Postgres si hay `DATABASE_URL`, si no SQLite local. CLIs y dashboard comparten la misma DB en la nube. |
| 2026-05-29 | **Login básico añadido.** Contraseña compartida (`DASHBOARD_PASSWORD`) + cookie de sesión firmada (`AUTH_SECRET`). Middleware protege todo el dashboard. Suficiente para uso interno; migrable a Supabase Auth si se necesita multi-usuario. |
| 2026-05-29 | **Build de producción verificado.** `npm run build` pasa limpio — confirma que el deploy a Vercel funcionará. Guía paso a paso en `docs/07-DEPLOY.md`. |
| 2026-05-31 | **Simplificación: solo Supabase.** Se eliminó SQLite por completo (rompía el build de Vercel — `better-sqlite3` es módulo nativo no empaquetable en serverless). El sistema ahora siempre usa Postgres vía `DATABASE_URL`. |
| 2026-05-31 | **DESPLEGADO en producción.** Dashboard vivo en https://teilur-lead-engine.vercel.app (Vercel + Supabase). Dos fixes clave: `vercel.json` con `framework: nextjs`, y `DATABASE_URL` con pooler puerto 6543 (la conexión directa 5432 no sirve desde Vercel serverless). |
| 2026-05-31 | **⚠️ Pendiente seguridad:** rotar claves expuestas en chat (Supabase password `Voxceed2026`, Apollo key, Gemini key) antes de uso oficial. |
| 2026-06-01 | **Búsqueda automática diaria desplegada.** GitHub Actions corre `search --to-db` cada mañana (7 AM Col), escribe a Supabase. Disparable manual con botón. Guía en `docs/08-BUSQUEDA-AUTOMATICA.md`. |
| 2026-06-01 | **Lección de deploy:** la URL de Supabase para Vercel/GitHub debe ser la del **pooler** (`...pooler.supabase.com:6543`), con usuario `postgres.[ref]`. NO el host directo `db.[ref].supabase.co`. Además, cambiar una env var en Vercel requiere **redeploy** (sin caché) para aplicar. |
| 2026-06-01 | **Rediseño completo de la interfaz.** Sistema visual editorial (Fraunces + Manrope, paleta verde de marca, fondo crema tintado). Inbox con jerarquía editorial y lista tipo registros. Detalle con layout asimétrico + sidebar sticky. Login split-screen. Responsive verificado. |
| 2026-06-01 | **ARREGLO de filtros.** Bug: "Todos los fits" excluía Rojos (mostraba 13 de 19). Ahora separa 3 casos: all (todos), color específico, default (verde+amarillo). Filtros aplican automáticamente sin botón; búsqueda con debounce. Verificado en navegador. |
