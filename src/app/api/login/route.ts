// src\app\api\login\route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signJwt } from "@/lib/usuarios/auth";
import { z } from "zod";
import {
  Roles,
  type Role,
  LoginBodySchema,
  LoginSuccessSchema,
} from "@/lib/usuarios/types";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

// Hash dummy para timing-attack mitigation cuando el usuario no existe
// Usa un hash bcrypt que siempre toma ~300ms para comparar
const DUMMY_HASH = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTU";

/**
 * ⚠️ SECURITY FIX: User enumeration prevention
 * Anteriormente, si el usuario no existía retornábamos error inmediato,
 * revelando al atacante cuáles usernames son válidos.
 * 
 * Ahora hacemos timing-safe comparison siempre, independientemente
 * de si el usuario existe o no.
 */
export async function POST(req: NextRequest) {
  // ⚠️ SECURITY: Rate limiting para prevenir brute force
  const clientIP = getClientIP(req as unknown as Request);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo más tarde." },
      { 
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetIn),
          "X-RateLimit-Remaining": "0",
        }
      }
    );
  }

  try {
    const body = await req.json();
    const { username, password } = LoginBodySchema.parse(body);

    // Solo seleccionamos campos necesarios
    const user = await prisma.usuario.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        contraseña: true, // Campo en español del schema
        Rol: { select: { nombre: true } },
      },
    });

    // ⚠️ SECURITY: Siempre hacemos verifyPassword para evitar timing attacks
    // Usamos el hash real si existe, o el dummy si no
    const hash = user?.contraseña ?? DUMMY_HASH;
    const passwordValid = await verifyPassword(password, hash);

    // ⚠️ SECURITY: Error genérico SIN importar si falló por user o password
    // Esto previene user enumeration
    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Normalizar Rol.nombre → enum Role
    const rawRole = String(user.Rol?.nombre ?? "").trim().toUpperCase();
    const role = z.enum(Roles).parse(rawRole) as Role;

    // Buscar profId si es médico
    let profId: number | undefined = undefined;
    if (role === "MEDICO") {
      const prof = await prisma.profesional.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (prof) profId = prof.id;
    }

    // Firmar JWT incluyendo profId si existe
    const token = signJwt({
      sub: String(user.id),
      email: user.email,
      role,
      username: user.username,
      ...(profId ? { profId } : {}),
    });

    const payload = LoginSuccessSchema.parse({
      message: "Login OK",
      role,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        role,
      },
      token,
    });

    const res = NextResponse.json(payload);
    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15, // 15 min
    });
    return res;
  } catch (err: any) {
    // ⚠️ SECURITY FIX: No exponer detail de Zod errors
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }
    console.error("[LOGIN]", err);
    return NextResponse.json(
      { error: "Error en login" },
      { status: 400 }
    );
  }
}
