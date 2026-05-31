# Flujo y Alcance

> **Última actualización:** 2026-05-22

---

## El negocio de Teilur Talent

Teilur Talent vende **nearshore staffing / recruiting** para empresas de EE.UU. y Canadá que quieren contratar talento tech remoto en LATAM. Maneja sourcing, vetting, payroll, contratos y compliance. El cliente gestiona al talento día a día; Teilur se encarga de lo demás.

**El lead ideal NO es "cualquiera que está contratando", sino alguien que:**
- Tiene necesidad real de talento tech (engineers, devs, DevOps, data, QA, product, AI, etc.)
- Está creciendo / contratando
- Es EE.UU. o Canadá
- Tiene poder de decisión o influencia (founder, CEO, CTO, VP Eng, Head of People, etc.)
- **NO** es una empresa que hace lo mismo que Teilur (staffing/recruiting/outsourcing/nearshore agency)

---

## El flujo actual de Melanie (manual)

### Fuente 1: LinkedIn
Busca con keywords ("hiring", "engineer", "remote"). Revisa publicaciones o perfiles. Filtra manualmente si la persona sirve, si es decision maker, si no es recruiter sin poder, si la empresa no compite. Envía connection request → espera aceptación → envía mensaje personalizado.

### Fuente 2: Wellfound (wellfound.com)
Busca startups con vacantes abiertas → entra al perfil de la empresa → busca el link de su web → usa la extensión de Apollo para encontrar el mejor contacto (a veces el CEO) → usa Claude para investigar la empresa y redactar el correo → envía.

### Fuente 3: Apollo
Busca empresas/personas con filtros → consigue número y email → usa HubSpot para CRM/seguimiento.

**Problema:** Todo es muy lento y manual. Se pierde mucho tiempo buscando y filtrando perfiles.

---

## Qué se automatiza y qué NO

| Parte del proceso | Nivel | Decisión |
|---|---|---|
| Buscar empresas contratando | Alto | ✅ Automatizar |
| Detectar si está contratando roles tech | Alto | ✅ IA + filtros |
| Detectar si es competidora | Alto | ✅ IA clasificadora |
| Encontrar decision maker | Alto | ✅ Automatizar (Apollo) |
| Encontrar email | Alto | ✅ Automatizar (Apollo) |
| Investigar empresa/persona | Alto | ✅ IA con prompt fijo |
| Redactar correo personalizado | Alto | ✅ IA con plantilla |
| Enviar cold email + follow-ups | Alto, con cuidado | ✅ Apollo Sequences / Instantly |
| **LinkedIn connection requests** | Bajo | ❌ **Manual siempre** (riesgo de ban) |
| Mensaje LinkedIn post-aceptación | Semi | ⚠️ IA redacta, Melanie envía |
| **Aprobación final del lead** | Humano | ❌ Melanie revisa verdes |
| **Respuestas con interés real** | Humano | ❌ IA hace draft, humano envía |

### ¿Por qué LinkedIn NO se automatiza?
LinkedIn prohíbe explícitamente herramientas de terceros que scrapeen o automaticen actividad. Automatizar connection requests o mensajes con bots puede terminar en **baneo de la cuenta**. Sales Navigator es una base de datos, no una herramienta de automatización. Melanie trabaja LinkedIn manualmente, pero el sistema le prepara los mensajes listos para copiar/pegar.

---

## El flujo automatizado propuesto

```
1. Lead Sourcing
   El sistema trae empresas desde Apollo (+ Wellfound vía Apify en fase 2)
        ↓
2. Company Enrichment
   Identifica: qué hace, tamaño, ubicación, industria, si contrata, qué roles,
   si es startup/scaleup, si compite con Teilur
        ↓
3. Contact Enrichment
   Encuentra: CEO/founder, CTO, VP Eng, Head of People, COO + email + LinkedIn
        ↓
4. AI Qualification
   Clasifica: Verde (contactar) / Amarillo (revisar) / Rojo (descartar) + score 0-100
        ↓
5. AI Personalization
   Genera: cold email, connection note de LinkedIn, follow-up, razón interna del fit
        ↓
6. Dashboard Review
   Melanie ve la lista filtrada y rankeada (ya no busca desde cero)
        ↓
7. Slack Approval
   Bot notifica leads nuevos; Melanie aprueba/rechaza con botones
        ↓
8. HubSpot Creation
   Crea contacto/empresa/deal/tarea
        ↓
9. Outreach
   Email: secuencia automática (tras aprobación)
   LinkedIn: tarea manual con mensaje listo
        ↓
10. Reply Detection → Human Follow-up
    Respuestas reales las maneja Melanie con apoyo de IA
```

---

## Meta de automatización

**~70–80% del proceso automatizable.** Lo que queda humano: LinkedIn, aprobación final, respuestas reales y conversaciones estratégicas.
