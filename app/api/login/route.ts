import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkPassword,
  makeSessionToken,
  SESSION_COOKIE_NAME,
} from "../../../src/dashboard/lib/auth";

const BodySchema = z.object({ password: z.string().min(1) });

/**
 * POST /api/login
 * Valida la contraseña y, si es correcta, setea la cookie de sesión.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta la contraseña" }, { status: 400 });
  }

  if (!checkPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, makeSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return response;
}
