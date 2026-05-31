# Teilur Talent Lead Engine — Resumen del Proyecto

> **Última actualización:** 2026-05-22
> **Estado:** Planificación (antes de construir)

---

## ¿Qué es esto?

Un sistema para automatizar el proceso de prospección comercial de **Teilur Talent** (teilurtalent.com), que vende staffing/recruiting nearshore de talento tech de LATAM para empresas de EE.UU. y Canadá.

Hoy una persona (Melanie) busca clientes manualmente en LinkedIn, Wellfound y Apollo, califica leads, investiga, redacta mensajes y contacta. Es lento y repetitivo.

**Objetivo:** Pasar de
`Melanie busca → analiza → investiga → redacta → contacta → registra`
a
`Sistema encuentra → califica → investiga → redacta → Melanie aprueba → CRM hace seguimiento`

---

## La idea en una frase

El sistema encuentra y califica leads automáticamente, redacta mensajes personalizados, y le entrega a Melanie una lista lista para aprobar. Ella solo revisa y aprueba; el sistema hace el resto. **LinkedIn se mantiene manual** por riesgo de baneo.

---

## Documentos de este plan

| Archivo | Contenido |
|---|---|
| `00-RESUMEN.md` | Este archivo — visión general |
| `01-FLUJO-Y-ALCANCE.md` | Qué se automatiza y qué no, flujo completo |
| `02-HERRAMIENTAS-Y-COSTOS.md` | Stack de herramientas, precios reales, comparativas |
| `03-ARQUITECTURA.md` | Arquitectura técnica del sistema |
| `04-CALIFICACION-LEADS.md` | Sistema de scoring y prompts de IA |
| `05-FASES-IMPLEMENTACION.md` | Plan por fases de construcción |
| `06-PENDIENTES-Y-DECISIONES.md` | Preguntas abiertas y decisiones tomadas |

---

## Resumen de costos (lo más importante)

**Ya lo tienen pagado:** Apollo, Sales Navigator, HubSpot.

**Costo adicional para arrancar:**

| Herramienta | Costo/mes |
|---|---|
| IA (Gemini Flash + Claude Haiku) | ~$2–10 (por uso) |
| Make.com Core (o n8n self-hosted) | ~$10–11 |
| **Total adicional** | **~$13–21/mes** |

**Costo de una sola vez:** construcción del dashboard web + bot de Slack (trabajo del dev del equipo).

**Opcional, fase 2 (solo si se necesita):** Apify ($29/mes) e Instantly ($30/mes).
