// src/app/api/yo/route.ts
import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

// GET: ruta no utilizada, se deja por compatibilidad
export async function GET() {
  return NextResponse.json(
    { error: "Usar método POST para esta ruta" },
    { status: 400 }
  );
}

// Mantener runtime explícito (igual que en middleware)
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1️⃣ Leer cookie con el token
    const cookie = (req.headers.get("cookie") ?? "")
      .split("; ")
      .find((c) => c.startsWith("auth_token="));

    const token = cookie?.split("=")[1];
    if (!token)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // 2️⃣ Verificar token JWT
    const payload = verifyJwt<JwtUser>(token);
    if (!payload)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    // 3️⃣ Devolver datos del usuario autenticado
    //    Incluimos ambos campos: role (nuevo) y rol (alias temporal)
    return NextResponse.json({
      id: Number(payload.sub), // se mantiene útil para identificar al usuario
      username: payload.username,
      email: payload.email,
      role: payload.role, // nuevo nombre correcto
      rol: payload.role,  // alias temporal para compatibilidad
    });
  } catch (err) {
    console.error("[YO API]", err);
    return NextResponse.json(
      { error: "Error al obtener datos del usuario" },
      { status: 500 }
    );
  }
}
