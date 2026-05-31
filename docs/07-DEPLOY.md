# Guía de Deploy: Vercel + Supabase

> **Última actualización:** 2026-05-29
> Objetivo: que el dashboard esté en internet para que Melanie acceda desde su
> navegador, sin depender de la PC de nadie.

---

## Arquitectura del deploy

```
┌─────────────────┐         ┌──────────────────┐
│   Tu PC (CLIs)  │         │     Vercel       │
│  search/ingest  │         │  (dashboard web) │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │   ambos escriben/leen     │
         └──────────┬────────────────┘
                    ▼
          ┌──────────────────┐
          │     Supabase     │
          │  (Postgres nube) │
          └──────────────────┘
```

- **Vercel** corre el dashboard (lo que ve Melanie).
- **Supabase** guarda los leads (Postgres).
- **Tu PC** corre `search` e `ingest` para alimentar la base de datos.
- Como CLIs y dashboard apuntan a la misma `DATABASE_URL`, todo está sincronizado.

---

## Parte 1: Crear la base de datos en Supabase (gratis)

1. Entra a **https://supabase.com** y crea una cuenta (con Google o email).
2. Clic en **New Project**.
   - Nombre: `teilur-lead-engine`
   - Database Password: pon una fuerte y **guárdala**.
   - Region: elige la más cercana (ej: `East US`).
3. Espera ~2 min a que se cree.
4. Ve a **Project Settings** (engranaje) → **Database** → sección **Connection string**.
5. Elige la pestaña **URI** y copia la cadena. Se ve así:
   ```
   postgresql://postgres.[ref]:[TU-PASSWORD]@aws-0-...pooler.supabase.com:6543/postgres
   ```
   - Reemplaza `[TU-PASSWORD]` por la contraseña que pusiste en el paso 2.
   - **Usa la versión "Connection pooling" (puerto 6543)** — funciona mejor con Vercel.

Esa cadena es tu `DATABASE_URL`.

> El schema (tablas) se crea solo automáticamente la primera vez que el sistema
> se conecta. No tienes que correr SQL a mano.

---

## Parte 2: Probar local apuntando a Supabase (antes de deployar)

1. En tu `.env` local, pega:
   ```
   DATABASE_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
   ```
2. Corre el ingest para cargar leads a Supabase:
   ```bash
   npm run search -- 20
   npm run ingest
   ```
   Debe decir: `🗄️  Base de datos: Postgres (nube)`.
3. Corre el dashboard local apuntando a Supabase:
   ```bash
   npm run dashboard
   ```
   Si ves los leads en http://localhost:3000, ya está conectado a la nube. ✅

---

## Parte 3: Subir el código a GitHub

Vercel deploya desde un repo de GitHub.

1. Crea un repo nuevo en https://github.com (privado).
2. Desde la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Teilur Lead Engine - dashboard"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/teilur-lead-engine.git
   git push -u origin main
   ```

> El archivo `.env` NO se sube (está en `.gitignore`). Las claves se configuran
> aparte en Vercel (Parte 4).

---

## Parte 4: Deploy a Vercel (gratis)

1. Entra a **https://vercel.com** y crea cuenta (con tu GitHub).
2. Clic en **Add New → Project**.
3. Importa el repo `teilur-lead-engine`.
4. Antes de hacer deploy, abre **Environment Variables** y agrega:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La cadena de Supabase (puerto 6543) |
   | `DASHBOARD_PASSWORD` | La contraseña que Melanie usará para entrar |
   | `AUTH_SECRET` | Un string largo aleatorio (ver abajo) |
   | `GEMINI_API_KEY` | Tu clave de Gemini (solo si vas a calificar desde la nube) |

   Para generar el `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Clic en **Deploy**. En ~2 min tendrás una URL tipo:
   ```
   https://teilur-lead-engine.vercel.app
   ```
6. Mándale esa URL y la contraseña a Melanie. Listo. ✅

---

## Flujo de trabajo diario (con el deploy hecho)

1. **Tú** (en tu PC) corres la búsqueda y la subes a la nube:
   ```bash
   npm run search -- 30
   npm run ingest
   ```
2. **Melanie** entra a la URL de Vercel, revisa los leads y aprueba/rechaza.
3. Los cambios de Melanie se guardan en Supabase, los ves tú también.

> Más adelante (Fase 3) se puede automatizar el paso 1 con un cron, para que
> los leads aparezcan solos cada mañana sin que nadie corra nada.

---

## ⚠️ Errores comunes del deploy (ya resueltos)

1. **"No Output Directory named public"** → Vercel no detectó Next.js.
   Solución: el `vercel.json` en la raíz fuerza `"framework": "nextjs"`.

2. **"server-side exception" al cargar leads** → la `DATABASE_URL` usaba el
   puerto **5432 (conexión directa)**, que NO funciona desde Vercel serverless.
   Solución: usar la cadena del **Transaction pooler (puerto 6543)** de Supabase
   (Connect → Transaction pooler). El host es tipo `aws-0-...pooler.supabase.com`.

   > Regla: **local puede usar 5432, pero Vercel SIEMPRE usa el pooler 6543.**

## Notas importantes

- **Free tier de Supabase:** el proyecto se pausa tras ~1 semana sin uso. La
  primera carga después de eso tarda unos segundos. Si molesta, el plan Pro
  ($25/mes) lo mantiene siempre activo.
- **Costo total del deploy:** $0/mes (Vercel Hobby + Supabase Free).
- **Seguridad:** el dashboard está protegido con contraseña. Igual, no compartas
  la URL públicamente.
- **CLIs en la nube:** por ahora `search`/`ingest` corren en tu PC. Si quieres
  que corran solos, eso es Fase 3 (cron job en Railway o GitHub Actions).
