import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "../../../src/dashboard/lib/auth";

/** POST /api/logout — borra la cookie de sesión. */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
