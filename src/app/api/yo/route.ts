import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export async function GET() {
  // lee cookie httpOnly del lado servidor
  const headers = new Headers();
  return NextResponse.json({ error: "Usar en route handler (no necesario)" }, { status: 400 });
}

// Versión recomendada: route handler "edge-aware"
export const runtime = "nodejs"; // mantener igual que middleware

export async function POST(req: Request) {
  // (workaround simple) nada de body; cookie viene por header
  const cookie = (req.headers.get("cookie") ?? "").split("; ").find(c => c.startsWith("auth_token="));
  const token = cookie?.split("=")[1];
  if (!token) return Response.json({ error: "No autenticado" }, { status: 401 });

  const payload = verifyJwt<JwtUser>(token);
  if (!payload) return Response.json({ error: "Token inválido" }, { status: 401 });

  return Response.json({
    id: Number(payload.sub),  // AGREGAMOS -------------------------------------------------- BORRAR ?????
    username: payload.username,
    role: payload.role,
    email: payload.email,
  });
}
