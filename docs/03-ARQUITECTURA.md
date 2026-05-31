# Arquitectura del Sistema

> **Última actualización:** 2026-05-22

---

## Decisión de arquitectura: Dashboard web + Slack bot + HubSpot

La mejor solución NO es solo un bot ni solo una página. Es una combinación:

- **Dashboard web** = donde vive todo el proceso (trabajo profundo)
- **Slack bot** = capa de acción rápida (notificar, aprobar, rechazar)
- **HubSpot** = sistema de registro comercial final (CRM)
- **IA por detrás** = investiga, califica y redacta

> ❌ Telegram NO se elige como canal principal — para una operación comercial B2B, Slack se integra mejor con workflows internos.

---

## Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FUENTES DE LEADS                         │
│   Apollo (principal)  │  Wellfound vía Apify (fase 2)  │      │
│   Job boards (fase 3) │  URLs manuales de LinkedIn       │    │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ORQUESTADOR (n8n self-hosted o Make)             │
│   Coordina todo el flujo entre herramientas                   │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  ENRIQUECIMIENTO (Apollo API)                 │
│   Empresa: tamaño, ubicación, industria, roles abiertos       │
│   Contacto: CEO/CTO/VP Eng/Head of People + email + LinkedIn  │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           IA DE CALIFICACIÓN (Gemini 2.5 Flash)               │
│   Score 0-100 · Verde/Amarillo/Rojo · Detección competidor    │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         IA DE PERSONALIZACIÓN (Claude Haiku 4.5)              │
│   Cold email · Nota LinkedIn · Follow-up · Razón del fit      │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (Postgres o similar)               │
│   Guarda leads, scores, mensajes, estado, historial          │
└───────────────┬─────────────────────────┬───────────────────┘
                ↓                          ↓
┌──────────────────────────┐   ┌──────────────────────────────┐
│   DASHBOARD WEB INTERNO   │   │        SLACK BOT             │
│   (Next.js / React)       │   │   Notifica leads nuevos      │
│   - Lead Inbox            │   │   Aprobar/Rechazar (botones) │
│   - Green Leads           │   │   Avisa respuestas            │
│   - Needs Review          │   └──────────────┬───────────────┘
│   - Competitors           │                  │
│   - Message Review        │                  │
│   - Performance           │                  │
└──────────────┬────────────┘                  │
              ↓ (Melanie aprueba)               │
┌─────────────────────────────────────────────────────────────┐
│                         HUBSPOT (CRM)                         │
│   Crea: empresa, contacto, deal, tarea                        │
│   Guarda: fuente, score, razón del fit, estado, owner         │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌──────────────────────────┐   ┌──────────────────────────────┐
│   EMAIL (aprobado)        │   │   LINKEDIN (manual)          │
│   Apollo Seq / Instantly  │   │   Tarea con mensaje listo    │
└──────────────┬────────────┘   └──────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│        DETECCIÓN DE RESPUESTAS → SLACK → Melanie responde     │
└─────────────────────────────────────────────────────────────┘
```

---

## Vistas del Dashboard

| Vista | Contenido |
|---|---|
| **Lead Inbox** | Todos los leads nuevos: Company, Score, Fit, Source, Hiring signal, Contact, Risk, Recommended action |
| **Green Leads** | Solo los mejores — Melanie revisa primero |
| **Needs Review** | Casos dudosos (buena señal pero contacto no ideal, sin email, posible agencia, rol no técnico) |
| **Competitors / Exclusions** | Para que el sistema aprenda — cada "competitor" marcado refina el filtro |
| **Message Review** | Bandeja de mensajes generados por IA — editar/aprobar/regenerar |
| **Performance** | Métricas: leads/semana, % verdes, reply rate, calls booked, etc. |

---

## Acciones disponibles para Melanie

Botones por lead:
- Approve for email
- Approve for LinkedIn
- Needs edit
- Wrong contact
- Not a fit
- Competitor
- Already contacted
- Send to HubSpot

---

## Ficha de un lead (al abrirlo)

```
Company: Example AI
Score: 88/100 · Clasificación: Verde
Fuente: Wellfound
Hiring signal: Backend Engineer, DevOps Engineer, Product Designer
Ubicación: US · Tamaño: 30–80 empleados
Website / LinkedIn: [links]
Contacto sugerido: CEO / Founder · Email: ✓
Riesgo: bajo
Razón del fit: contratando roles técnicos, podrían beneficiarse de talento LATAM
Ángulo recomendado: acelerar hiring técnico sin subir costos de payroll US

Mensajes generados:
- Connection request LinkedIn
- Primer mensaje post-aceptación
- Cold email
- Follow-up 1 y 2
- Nota interna para HubSpot
```

---

## El sistema debe APRENDER de Melanie

Cada acción de Melanie alimenta el sistema:
- Aprueba un lead → entiende qué es buen fit
- Rechaza por competidor → mejora el filtro
- Cambia el contacto sugerido → aprende qué título funciona
- Edita el mensaje → aprende el tono
- Un tipo de lead responde → sube el peso de esa señal
- Un tipo nunca responde → baja prioridad

> No es solo automatización: es un **lead engine entrenado con el criterio comercial de Teilur**.

---

## Stack técnico sugerido (para el dev)

| Componente | Tecnología sugerida |
|---|---|
| Dashboard web | Next.js + React + Tailwind |
| Base de datos | PostgreSQL (Supabase o Railway) |
| Orquestación | n8n self-hosted (o Make) |
| Bot | Slack API (Block Kit para botones interactivos) |
| IA | Gemini 2.5 Flash + Claude Haiku 4.5 (vía API) |
| Hosting | Railway / Render / VPS DigitalOcean |

> Estas son sugerencias; el dev decide según su experiencia. Lo importante es que sea código propio (más barato y flexible que Retool/Airtable a escala).
