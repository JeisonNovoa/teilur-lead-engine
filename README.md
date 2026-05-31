# Teilur Lead Engine — Fase 1 (MVP de calificación)

Script que toma una lista de leads exportada de Apollo (CSV), los califica
automáticamente con IA (Gemini) y genera un archivo listo para que Melanie revise:
score, clasificación verde/amarillo/rojo, mejor contacto, email sugerido y nota de LinkedIn.

> 📚 La documentación completa del proyecto (plan, costos, fases, arquitectura)
> está en la carpeta [`docs/`](./docs/).

---

## ¿Qué hace exactamente?

1. Lee un CSV de Apollo (`data/input/tu-lista.csv`)
2. Por cada lead, le pregunta a la IA si es buen cliente para Teilur
3. Escribe los resultados ordenados (verdes primero) en `data/output/`:
   - Un **`.csv`** legible para abrir en Excel/Google Sheets
   - Un **`.json`** completo (para el dashboard de la Fase 2)

No envía nada, no contacta a nadie. Solo califica y prepara mensajes. **Tú decides.**

---

## Instalación (una sola vez)

Necesitas tener [Node.js](https://nodejs.org) 20+ instalado.

```bash
npm install
```

### Configurar la API key de IA

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Consigue una API key **gratis** en 👉 https://aistudio.google.com/app/apikey
   (inicia sesión con Google → "Create API key" → copia la clave que empieza con `AIza...`)
3. Abre el archivo `.env` y pégala:
   ```
   GEMINI_API_KEY=AIza...tu-clave-aqui
   ```

> 💡 La clave es gratis para empezar. Gemini 2.5 Flash tiene una capa gratuita
> generosa; si se supera, el costo es de centavos (ver `docs/02-HERRAMIENTAS-Y-COSTOS.md`).

---

## Cómo usarlo

### Modo A (recomendado): buscar y calificar en un paso, vía Apollo API
El sistema busca leads directamente en Apollo (sin exportar nada) y los califica.
Los filtros (decision makers, US/Canada, hiring engineers) están en
`src/lib/apollo-filters.ts`.

```bash
npm run search             # busca 25 leads (default)
npm run search -- 50       # busca 50 leads
```

> 💡 El endpoint de búsqueda de Apollo NO consume créditos — buscar es gratis.

### Modo B: desde un CSV exportado de Apollo
Si prefieres trabajar con un CSV exportado a mano:
```bash
npm run qualify -- data/input/tu-lista.csv
```

Verás algo así mientras procesa:
```
📥 Leyendo leads del CSV...
✅ 50 lead(s) encontrados.
🤖 Calificando con gemini-2.5-flash (concurrencia: 3)...

  [1/50] 🟢 Verde (87)  Acme SaaS
  [2/50] 🔴 Rojo (15)  StaffPro Recruiting
  [3/50] 🟢 Verde (78)  DataFlow Analytics
  ...

──────────── Resumen ────────────
  🟢 Verdes:    18
  🟡 Amarillos: 20
  🔴 Rojos:     12
──────────────────────────────────

📄 Resultados para Melanie: data/output/tu-lista-calificados-2026-05-22-15-54-11.csv
```

### Paso 3: Revisa los resultados
Abre el archivo `.csv` de `data/output/` en Excel o Google Sheets.
Está ordenado: verdes primero, luego amarillos, luego rojos.

---

## Probar con datos de ejemplo

Hay un CSV de prueba incluido:
```bash
npm run qualify -- data/input/ejemplo.csv
```

---

## Columnas del CSV de salida

| Columna | Qué es |
|---|---|
| Empresa | Nombre de la empresa |
| Fit | Verde / Amarillo / Rojo |
| Score | 0–100 |
| Competidor | Si la IA detecta que compite con Teilur |
| Mejor contacto | Título de la persona ideal para contactar |
| Por qué sí / Por qué no | Razones del fit |
| Ángulo | Ángulo de outreach recomendado |
| Email sugerido | Borrador de cold email |
| Nota LinkedIn | Borrador de connection note |
| Error | Si algo falló al calificar ese lead |

---

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run search` | Busca leads en Apollo (con filtros de Teilur) y los califica |
| `npm run search -- 50` | Igual, pero limitando a N leads |
| `npm run qualify -- <archivo.csv>` | Califica un CSV de leads ya exportado |
| `npm run ingest` | Importa los leads del último JSON a la base de datos local |
| `npm run dashboard` | Abre el dashboard interno en http://localhost:3000 |
| `npm test` | Corre los tests |
| `npm run typecheck` | Verifica tipos de TypeScript |

## Flujo completo con dashboard (Fase 2)

```bash
# 1. Buscar leads en Apollo y calificar con IA
npm run search -- 30

# 2. Importar a la base de datos local
npm run ingest

# 3. Abrir el dashboard
npm run dashboard
# → http://localhost:3000
```

En el dashboard Melanie puede:
- Ver los leads ordenados por fit (verdes primero) y score
- Filtrar por estado (pendientes / aprobados / rechazados)
- Buscar por nombre de empresa o contacto
- Abrir cada lead para ver toda la info y los mensajes generados
- Copiar email y nota de LinkedIn con un clic
- Aprobar (email / LinkedIn / ambos) o descartar (rechazar / competidor / contacto incorrecto)

Los Rojos detectados por la IA se descartan automáticamente y no aparecen en su vista
(pero quedan en la base de datos para auditoría).

---

## Ajustar el criterio de calificación

Si Melanie quiere cambiar qué considera buen lead, se edita el prompt en:
**`src/lib/prompt.ts`** (y se actualiza `docs/04-CALIFICACION-LEADS.md`).

## Ajustar los filtros de Apollo

Para cambiar qué decision makers, ubicaciones, vacantes o tamaños de empresa
se buscan, edita: **`src/lib/apollo-filters.ts`**. Los cambios se aplican
en la siguiente corrida de `npm run search`.

## Configuración avanzada (`.env`)

| Variable | Default | Qué hace |
|---|---|---|
| `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo de IA |
| `CONCURRENCY` | `3` | Cuántos leads procesa en paralelo |
| `BATCH_DELAY_MS` | `1000` | Pausa entre lotes (ms) |

---

## Estructura del proyecto

```
bot/
├── docs/                  # Documentación del plan completo
├── data/
│   ├── input/             # Aquí pones los CSV de Apollo
│   └── output/            # Aquí salen los resultados calificados
├── src/
│   ├── cli/
│   │   ├── search.ts        # Comando "search": busca en Apollo + califica
│   │   └── qualify.ts       # Comando "qualify": califica un CSV
│   ├── lib/
│   │   ├── config.ts          # Lee .env
│   │   ├── csv-reader.ts      # Lee CSV de Apollo
│   │   ├── apollo-client.ts   # Cliente HTTP de Apollo API
│   │   ├── apollo-filters.ts  # Filtros de Teilur (editable)
│   │   ├── apollo-mapper.ts   # Apollo → LeadInput
│   │   ├── prompt.ts          # Criterio comercial de Teilur (editable)
│   │   ├── qualifier.ts       # Llama a Gemini
│   │   ├── process-leads.ts   # Procesa en lotes
│   │   └── results-writer.ts  # Escribe CSV/JSON
│   └── types/lead.ts      # Tipos y validación
└── README.md
```
