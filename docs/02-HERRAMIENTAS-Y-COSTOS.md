# Herramientas y Costos

> **Última actualización:** 2026-05-22
> Todos los precios verificados en mayo 2026. Ver fuentes al final.

---

## Lo que Teilur YA tiene (sin costo adicional)

| Herramienta | Uso en el sistema |
|---|---|
| **Apollo** | Lead sourcing, enriquecimiento de empresa/contacto, emails, secuencias |
| **Sales Navigator** | Búsqueda de señales y perfiles en LinkedIn (manual) |
| **HubSpot** | CRM final: contactos, empresas, deals, tareas, seguimiento |

> ⚠️ **Pendiente confirmar con Melanie:** ¿Apollo es plan pagado o free? El free tiene solo 100 créditos/mes (insuficiente).

---

## Decisiones de herramientas (con investigación)

### 1. IA — Modelos de lenguaje

Comparativa de precios reales (por 1M tokens, mayo 2026):

| Modelo | Input / Output | Notas |
|---|---|---|
| **GPT-4o mini** (OpenAI) | $0.15 / $0.60 | El más barato |
| **Gemini 2.5 Flash** (Google) | $0.30 / $2.50 | 97.1% calidad, contexto 1M, muy rápido |
| **Claude Haiku 4.5** (Anthropic) | $1.00 / $5.00 | 95.9% calidad, **mejor en outputs estructurados (JSON) y redacción** |
| GPT-4o | $2.50 / $10.00 | Caro, innecesario |
| Claude Sonnet 4.6 | $3.00 / $15.00 | Caro, solo si se necesita redacción premium |

**DECISIÓN:** Usar dos modelos según tarea:
- **Calificar leads + detectar competidor →** Gemini 2.5 Flash (barato, suficiente)
- **Redactar correos + notas de LinkedIn →** Claude Haiku 4.5 (mejor redacción)
- *Alternativa simple:* usar solo Gemini 2.5 Flash para todo.

**¿Dónde se paga?** Directo en consola del proveedor (pago por uso):
- Gemini: aistudio.google.com / Google Cloud
- Claude: console.anthropic.com

**Estimado de costo mensual** (1,500 tokens in + 500 out por lead):

| Volumen | Gemini Flash | Claude Haiku |
|---|---|---|
| 400 leads/mes | ~$0.45 | ~$1.60 |
| 1,200 leads/mes | ~$1.35 | ~$4.80 |
| 2,000 leads/mes | ~$2.25 | ~$8.00 |

> Costo real esperado: **$2–10/mes**. Insignificante.

---

### 2. Automatización (el "pegamento")

| Herramienta | Precio | Pros | Contras |
|---|---|---|---|
| Zapier | $19.99/mes (750 tareas) | Fácil, 9,000 integraciones | Caro a escala |
| **Make.com Core** | **$10.59/mes (10,000 ops)** | Más barato, potente | Curva media |
| Make Free | $0 | — | ❌ Solo 1,000 ops + 2 escenarios. **No alcanza** |
| n8n Cloud | €24/mes (2,500 ejec.) | Nativo IA | Más caro que self-hosted |
| **n8n self-hosted** | **~$10/mes (servidor) — ILIMITADO** | Gratis el software, IA nativa (LangChain), sin límites | Requiere que el dev lo configure |

**DECISIÓN:** Si el dev puede manejar un servidor → **n8n self-hosted** (ilimitado, mejor para IA). Si prefieren algo visual sin servidor → **Make Core ($10.59/mes)**.

> ⚠️ El free de Make NO alcanza: un flujo de este sistema usa 6–8 operaciones por lead, así que 1,000 ops = solo ~125–166 leads/mes.
> ⚠️ n8n ya no tiene plan cloud gratis permanente (solo trial de 14 días). El self-hosted sí es gratis (solo pagas servidor).

---

### 3. CRM — HubSpot

| Plan | Precio | ¿Necesario? |
|---|---|---|
| **Free CRM** | $0 | ✅ Suficiente al inicio (contactos, empresas, deals, tareas) |
| Starter | $20/seat/mes | Solo si necesitan secuencias dentro de HubSpot |
| Professional | $100/seat/mes | No necesario |

**DECISIÓN:** Usar lo que ya tienen. HubSpot Free cubre lo necesario al inicio.

---

### 4. Cold Email (envío)

| Herramienta | Precio | Notas |
|---|---|---|
| **Apollo Sequences** | Incluido en plan pagado | ✅ Ya lo tienen, usar primero |
| Instantly (Growth) | $30/mes | Cuentas ilimitadas, mejor deliverability, 160M leads |
| Smartlead (Basic) | $39/mes | Buen control técnico/API |
| HubSpot Sequences | Limitado en free | ❌ Evitar para cold outreach |

**DECISIÓN:** Empezar con **Apollo Sequences** (ya incluido, $0 extra). Migrar a **Instantly** solo si el deliverability falla o el volumen crece. → **Fase 2**

---

### 5. Fuente Wellfound (no tiene API pública)

| Opción | Precio | Notas |
|---|---|---|
| **Apify — Wellfound scraper** | $29/mes + ~$0.05/1k resultados | Actor ya existe, listo para usar |
| Scraper propio | Solo tiempo dev | Mantenimiento alto |
| Coresignal | Enterprise | Overkill |

**DECISIÓN:** **Apify** solo en **Fase 2/3**, si Apollo no da suficientes leads. No necesario al inicio.

---

### 6. LinkedIn — Sales Navigator (ya lo tienen)

No automatizar. Sales Nav es para búsqueda manual. Riesgo de ban con bots es real. El sistema solo prepara los mensajes; Melanie los envía manualmente.

---

### 7. Validación de emails (importante para no quemar el dominio)

| Herramienta | Precio | Notas |
|---|---|---|
| Apollo (incluido) | $0 | Verificación básica |
| NeverBounce | ~$8/1,000 emails | Si el bounce rate sube de 3% |
| ZeroBounce | Similar | Alternativa |

**DECISIÓN:** Usar verificación de Apollo al inicio. Agregar NeverBounce solo si hay problemas de bounce. → **Fase 2/3**

---

## Resumen de stack y costos

### Opción A — MVP lean (recomendada para arrancar)

| Herramienta | Costo/mes |
|---|---|
| Apollo (ya pagado) | $0 extra |
| HubSpot (ya pagado) | $0 extra |
| Sales Navigator (ya pagado) | $0 extra |
| IA (Gemini + Claude API) | ~$2–10 |
| Make Core *o* n8n self-hosted | ~$10–11 |
| **TOTAL ADICIONAL** | **~$13–21/mes** |

### Opción B — Con fuentes y email dedicado (Fase 2)

Opción A + Apify ($29) + Instantly ($30) = **~$72–80/mes adicional**

### Costo de una sola vez (no recurrente)
- Dashboard web (Next.js o similar) — construido por el dev del equipo
- Bot de Slack — construido por el dev del equipo

---

## Fuentes de precios (mayo 2026)

- Apollo: salesmotion.io/blog/apollo-pricing
- Clay: lagrowthmachine.com/clay-pricing
- HubSpot: mo.agency/blog/hubspot-pricing
- Instantly vs Smartlead: coldemailkit.com/compare/instantly-vs-smartlead
- Make vs Zapier vs n8n: digidop.com/blog/n8n-vs-make-vs-zapier
- Make pricing/free: make.com/en/pricing
- n8n pricing: n8n.io/pricing
- Apify: apify.com/pricing
- Claude API: platform.claude.com/docs/en/about-claude/pricing
- AI pricing comparison: devtk.ai/en/blog/ai-api-pricing-comparison-2026
- Gemini Flash vs Claude Haiku: artificialanalysis.ai
