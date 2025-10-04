// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

// Qué rutas están protegidas y qué roles pueden pasar
const ACL: Record<string, Array<JwtUser["role"]>> = {
  "/Pacientes": ["RECEPCIONISTA", "GERENTE"],
  "/specialist": ["MEDICO", "GERENTE"],
  "/admin": ["GERENTE"],
  "/turnos": ["RECEPCIONISTA", "GERENTE"],
  "/profesionales": ["GERENTE"],
  "/reception": ["RECEPCIONISTA", "GERENTE"],
  "/dashboard": ["RECEPCIONISTA", "MEDICO", "GERENTE"],
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ¿Aplica a alguna base protegida?
  const base = Object.keys(ACL).find((p) => pathname.startsWith(p));
  if (!base) return NextResponse.next();

  // Sin token → login con ?next=
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const to = new URL("/login", req.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }

  // Verificar JWT (usa jsonwebtoken en runtime nodejs)
  const payload = verifyJwt<JwtUser>(token);
  if (!payload) {
    const to = new URL("/login", req.url);
    const res = NextResponse.redirect(to);
    res.cookies.delete("auth_token"); // limpia cookie inválida/expirada
    return res;
  }

  // Chequear permiso por rol
  if (!ACL[base].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// Según doc: matcher explícito + runtime Node.js para poder usar jsonwebtoken
export const config = {
  matcher: [
    "/Pacientes",
    "/Pacientes/:path*",
    "/turnos",
    "/turnos/:path*",
    "/profesionales",
    "/profesionales/:path*",
    "/specialist",
    "/specialist/:path*",
    "/admin",
    "/admin/:path*",
    "/reception",
    "/reception/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
  runtime: "nodejs",
};
