# Búsqueda automática diaria (GitHub Actions)

> **Última actualización:** 2026-05-31
> Objetivo: que los leads aparezcan solos en el dashboard cada mañana,
> sin que nadie corra nada manualmente.

---

## Cómo funciona

```
GitHub Actions (cada mañana, 7 AM Colombia)
   ↓
Corre: npm run search -- 15 --to-db
   ↓
Busca 15 leads en Apollo → califica con IA → enriquece → escribe a Supabase
   ↓
Melanie abre el dashboard de Vercel → ve los leads nuevos
```

- **No usa la PC de nadie.** Corre en los servidores de GitHub.
- **Gratis:** GitHub Actions da 2,000 minutos/mes; esto usa ~5 min/día (~150/mes).
- **Por qué GitHub Actions y no Vercel Cron:** el plan gratis de Vercel corta
  las funciones a los 10 segundos; nuestro proceso tarda minutos. GitHub Actions
  no tiene ese límite.

---

## Configuración (una sola vez)

El workflow ya está en `.github/workflows/daily-search.yml`. Solo falta darle
las claves (secrets) para que pueda usar Apollo, Gemini y Supabase.

### Paso 1: Agregar los secrets en GitHub

1. Ve a tu repo en GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Clic en **New repository secret** y agrega estos 4 (uno por uno):

   | Name | Value |
   |---|---|
   | `APOLLO_API_KEY` | Tu API key de Apollo |
   | `GEMINI_API_KEY` | Tu API key de Gemini |
   | `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
   | `DATABASE_URL` | La cadena de Supabase con **pooler (puerto 6543)** |

   > Usa la MISMA `DATABASE_URL` que pusiste en Vercel (la del pooler 6543),
   > para que escriba en la misma base de datos que lee el dashboard.

### Paso 2: Probar que funciona (manual)

1. Ve a la pestaña **Actions** de tu repo
2. Elige **"Búsqueda diaria de leads"** en la lista de la izquierda
3. Clic en **Run workflow** (botón a la derecha)
4. Opcional: cambia el número de leads (default 15)
5. Clic en **Run workflow** verde
6. En ~3-5 min, revisa que terminó en verde ✅
7. Abre el dashboard de Vercel → deberías ver los leads nuevos

### Paso 3: Listo

A partir de ahí corre solo cada mañana. No hay que hacer nada más.

---

## Ajustes comunes

### Cambiar cuántos leads busca al día
En `.github/workflows/daily-search.yml`, cambia el `default: "15"` o el `MAX:-15`.

### Cambiar la hora
En el mismo archivo, la línea `cron: "0 12 * * *"`:
- El número `12` es la hora en **UTC**.
- Colombia es UTC-5, así que 12 UTC = 7 AM Colombia.
- Para las 8 AM Colombia → `"0 13 * * *"`.

### Pausar la búsqueda automática
En la pestaña Actions → "Búsqueda diaria de leads" → botón **"..."** → Disable workflow.

---

## Costo de créditos Apollo

- 15 leads/día × 30 días = ~450 búsquedas/mes
- Pero solo se enriquecen los Verdes/Amarillos (~60-70%), así que el gasto real
  de créditos es ~300/mes (de los 1,000 del plan Basic). Queda margen amplio.

> Si quieres más volumen, sube el número, pero vigila no pasar de 1,000 créditos/mes.
