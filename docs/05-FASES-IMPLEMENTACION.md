# Fases de Implementación

> **Última actualización:** 2026-05-22

Estrategia: validar la calidad del scoring de IA ANTES de construir todo. No construir de más antes de probar que funciona.

---

## Fase 1 — MVP (validación)

**Objetivo:** Que Melanie deje de buscar e investigar leads desde cero.

**Duración estimada:** 2–3 semanas de dev.

**Pasos:**
1. Configurar Apollo con los filtros definidos (ver más abajo) → exportar lista CSV
2. Script o flujo (Make/n8n) que toma la lista y llama a la IA para calificar cada lead
3. La IA genera: score, clasificación verde/amarillo/rojo, mejor contacto, email sugerido, nota de LinkedIn, razón del fit
4. Resultado se guarda en Google Sheets o tabla simple
5. Melanie revisa la hoja, aprueba manualmente, copia los mensajes

**Stack:** Apollo (ya pagado) + IA (Gemini/Claude) + Make/n8n + Google Sheets/HubSpot

**Costo:** ~$13–21/mes

**Criterio de éxito:** ¿La IA califica bien? ¿Los mensajes son buenos? ¿Melanie ahorra tiempo real? Si sí → Fase 2.

### Filtros sugeridos en Apollo
- **Location:** United States, Canada
- **Company headcount:** 11–500
- **Industry:** Software, SaaS, AI, FinTech, HealthTech, E-commerce, Marketplace, Cybersecurity, Logistics, B2B Services
- **Keywords:** hiring, software engineer, devops, full stack, backend, cloud, data engineer
- **Excluir:** staffing, recruiting, outsourcing, offshore, nearshore, IT services agency, talent marketplace
- **Personas:** CEO, Founder, Co-Founder, CTO, VP Engineering, Head of People, Head of Talent, COO, Chief of Staff

---

## Fase 2 — Dashboard + Slack bot

**Objetivo:** Sistema real, no una hoja de cálculo.

**Duración estimada:** 3–4 semanas de dev.

**Pasos:**
1. Dev construye dashboard web (Next.js o similar) con las 6 vistas (ver `03-ARQUITECTURA.md`)
2. Botones de aprobación: Approve email / Approve LinkedIn / Reject / Wrong contact / Competitor
3. Slack bot: notifica leads nuevos cada mañana, permite aprobar/rechazar con botones
4. Al aprobar → crea contacto/empresa/tarea en HubSpot vía API
5. Al aprobar email → dispara secuencia en Apollo (o Instantly)
6. *(Opcional)* Integrar Apify para scraping de Wellfound
7. *(Opcional)* Migrar a Instantly si el deliverability de Apollo falla

**Stack adicional posible:** Apify ($29/mes), Instantly ($30/mes) — solo si se necesitan.

---

## Fase 3 — Fuentes adicionales + aprendizaje

**Objetivo:** Sistema aprende de Melanie y cubre más fuentes.

**Pasos:**
1. Agregar job boards adicionales (LinkedIn job posts públicos, Indeed, Otta)
2. Sistema de retroalimentación: cuando Melanie marca "competitor"/"wrong contact", refina los prompts
3. Automatización por vertical (DevOps, cybersecurity, QA, data, ecommerce, etc.)
4. Validación de emails (NeverBounce) si el bounce rate sube

---

## Métricas a medir (desde Fase 2)

- Leads encontrados por semana
- % verdes
- % con email válido
- Connection acceptance rate (LinkedIn)
- Email reply rate
- Meetings booked
- Qualified calls
- Green light job descriptions
- Closed deals
- CAC por canal

---

## Simulación de un día normal (sistema construido)

```
8:30  Slack: "24 leads nuevos. 9 Verdes, 8 Amarillos, 7 Rojos. 5 need review."
       Melanie hace clic en "Review Green Leads".

8:35  Dashboard: ve los leads rankeados. No revisa 100 perfiles, solo los mejores.

8:45  Abre un lead. El sistema ya: revisó la empresa, detectó vacantes,
       verificó si es competidor, buscó contacto y email, generó mensajes.
       Melanie decide: "Sí, este vale la pena."

8:50  Aprueba. El sistema crea empresa+contacto en HubSpot, guarda fuente/score/razón,
       crea tarea "Send LinkedIn connection request", manda email a secuencia si aprobado.

9:00  Melanie abre LinkedIn manualmente. El dashboard le muestra el mensaje listo.
       Ella copia, revisa y envía.

11:00 Alguien responde un email. El sistema avisa en Slack:
       "New positive reply from Example AI. They asked about LATAM engineering candidates."
       Botones: Draft reply / Assign / Create meeting task / Move to qualified / Open in HubSpot
```
