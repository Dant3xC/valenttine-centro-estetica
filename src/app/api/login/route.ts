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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = LoginBodySchema.parse(body);

    const user = await prisma.usuario.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        // el nombre del campo en tu schema es "contraseña"
        contraseña: true,
        Rol: { select: { nombre: true } }, // <-- tabla Rol
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const hash = (user as any)["contraseña"] as string | undefined;
    if (!hash) {
      return NextResponse.json({ error: "Usuario sin contraseña" }, { status: 401 });
    }

    const ok = await verifyPassword(password, hash);
    if (!ok) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Normalizar Rol.nombre → enum Role
    const rawRole = String(user.Rol?.nombre ?? "").trim().toUpperCase();
    const role = z.enum(Roles).parse(rawRole) as Role; // "RECEPCIONISTA" | "MEDICO" | "GERENTE"

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

    // La respuesta JSON queda igual (no incluimos profId para no tocar el schema)
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
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", detail: err.issues }, { status: 400 });
    }
    console.error("[LOGIN]", err);
    return NextResponse.json({ error: "Error en login" }, { status: 400 });
  }
}
