import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Auth simple para un dashboard interno: una sola contraseña compartida.
 * Suficiente para que el dashboard no quede abierto a internet.
 *
 * - DASHBOARD_PASSWORD: la contraseña que Melanie escribe para entrar.
 * - AUTH_SECRET: secreto para firmar la cookie de sesión (cualquier string largo random).
 *
 * Si más adelante hace falta multi-usuario, se migra a Supabase Auth.
 */

const COOKIE_NAME = "teilur_session";

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

function getPassword(): string {
  // En local sin configurar, password por defecto para no bloquear el desarrollo.
  return process.env.DASHBOARD_PASSWORD || "teilur";
}

/** Verifica si la contraseña ingresada es correcta (comparación a prueba de timing). */
export function checkPassword(input: string): boolean {
  const expected = Buffer.from(getPassword());
  const got = Buffer.from(input);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

/** Genera el token de sesión firmado que se guarda en la cookie. */
export function makeSessionToken(): string {
  const payload = `authenticated:${Date.now()}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

/** Valida un token de sesión (que la firma coincida). */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64").toString("utf-8");
  } catch {
    return false;
  }
  const expectedSig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (sig.length !== expectedSig.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
