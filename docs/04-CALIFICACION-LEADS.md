# Sistema de Calificación de Leads

> **Última actualización:** 2026-05-22

Este es el **corazón del sistema**. Define qué es un buen lead y qué no.

---

## Matriz de Lead Scoring (0–100)

### A. Señal de hiring — 30 puntos
Buen lead si tiene:
- Vacantes abiertas de software engineering
- Vacantes de DevOps, cloud, data, cybersecurity, QA, product, design, AI
- Publicaciones recientes tipo "we're hiring"
- Hiring en US/Canada con roles que podrían ser remotos

### B. Fit con Teilur — 25 puntos
Buen lead si:
- Empresa de EE.UU. o Canadá
- Startup, scaleup, SaaS, ecommerce, marketplace, healthtech, fintech, AI
- Entre 10 y 500 empleados
- Probablemente necesita reducir costo de contratación o acelerar hiring
- No parece tener un equipo grande de recruiting interno

### C. Persona correcta — 25 puntos

**Prioridad alta:**
Founder / CEO · COO · CTO · VP Engineering · Head of Talent · Head of People · Chief of Staff · VP Operations · Hiring Manager técnico

**Prioridad baja:**
Recruiter junior · Talent Acquisition Specialist sin seniority · Sourcer · Agency recruiter · People intern · Otro proveedor de staffing/recruiting

### D. NO competidor — 20 puntos
Descartar o bajar score si la empresa es:
- Staffing agency
- Recruiting agency / firm
- Outsourcing company
- Nearshore/offshore development agency
- Vende EOR / staff augmentation como core business
- "AI development agency" o software outsourcing que busca partnership, no contratar talento

---

## Clasificación de colores

| Color | Significado | Criterio |
|---|---|---|
| 🟢 **Verde** | Contactar | Hiring activo, construyendo equipo, necesita execution capacity, abierto a nearshore LATAM |
| 🟡 **Amarillo** | Revisar manual | Muy early, poca evidencia de budget, señal débil, o contacto no ideal |
| 🔴 **Rojo** | Descartar | Competidor, recruiter sin poder, agency, networking sin intención, sin hiring signal |

---

## Clasificación de señales de hiring

| Señal | Peso |
|---|---|
| Engineering roles abiertos | Fuerte |
| Sales roles | Media |
| Recruiting role abierto | Puede indicar crecimiento, pero no necesidad directa de Teilur |
| Sin roles abiertos | Débil |

---

## Detección de competidores (marcar ROJO)

El sistema marca rojo si detecta:
- Staffing agency
- Recruiting firm
- Nearshore agency
- Outsourcing company
- Software development agency
- EOR / payroll provider
- Talent marketplace

---

## Prompt base para calificar leads (IA)

> Usar con Gemini 2.5 Flash. Devuelve JSON estructurado.

```
You are evaluating whether this company is a good outbound lead for Teilur Talent.

Teilur Talent helps US and Canadian companies hire pre-vetted remote tech talent
from Latin America. Teilur is NOT a software agency or managed service provider.
The client manages the talent day to day; Teilur handles sourcing, vetting, payroll,
contracts, and compliance.

Evaluate the company using these criteria:
1. Is the company based in the US or Canada?
2. Is the company hiring technical roles?
3. Are the open roles relevant to software engineering, DevOps, cloud, cybersecurity,
   data, QA, product, design, or AI?
4. Is the company likely to benefit from nearshore LATAM hiring?
5. Is the contact a decision maker or influencer?
6. Is the company a competitor, staffing agency, outsourcing company, recruiting firm,
   EOR provider, or software development agency?
7. Is there enough evidence to justify personalized outreach?

Return (as JSON):
- fit_classification: "Green" | "Yellow" | "Red"
- score: 0 to 100
- best_contact_title: string
- why_fit: string
- why_not_fit: string
- recommended_outreach_angle: string
- personalized_first_line: string
- suggested_email: string
- suggested_linkedin_note: string
```

---

## Ejemplo de output que recibe Melanie

| Campo | Ejemplo |
|---|---|
| Company | Manifest |
| Source | LinkedIn post |
| Hiring signal | GTM Engineer role open |
| Fit | 🟢 Green |
| Score | 82/100 |
| Best contact | Founder / Head of Growth |
| Why fit | Distributed team, hiring technical/GTM hybrid, likely scaling |
| Risk | Prefers Midwest talent |
| Angle | Remote LATAM GTM/technical talent aligned to US time zones |
| Action | Send connection request |
| Message | "Saw you're hiring a GTM Engineer…" |

---

## Compliance de cold email (importante)

Como Teilur contacta empresas de US/Canada, el cold email debe cumplir **CAN-SPAM (FTC)**:
- Usar correos verificados
- No mentir en subject lines
- Incluir opt-out
- No mandar demasiados follow-ups
- No contactar gente irrelevante
- Mantener registro de fuente y razón de contacto
- No usar datos personales sensibles
- **Pausar automáticamente** si alguien responde "not interested" o "unsubscribe"

Si contactan UK/Europa → considerar **GDPR/UK GDPR** (derecho a oponerse al marketing directo).

> ⚠️ **Nunca enviar cold email desde el dominio principal `teilurtalent.com`** — usar un dominio secundario con warm-up para no quemar la reputación del principal. (Pendiente confirmar con Melanie qué dominio usan.)
