import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import type { JwtUser } from "./types"; // ✅ Usa el tipo único de types.ts

// ⚠️ SECURITY: JWT_SECRET es OBLIGATORIO - lanzar error claro si falta
const SECRET = process.env.JWT_SECRET as Secret | undefined;
if (!SECRET) {
  throw new Error(
    "❌ SECURITY ERROR: JWT_SECRET environment variable is required. " +
    "Set it in your .env file before starting the server."
  );
}

const EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES as SignOptions["expiresIn"]) ?? "15m"; // Default 15 min

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// firma el JWT (no expone la contraseña, solo el payload que le pases)
export function signJwt(payload: object) {
  const options: SignOptions = { expiresIn: EXPIRES_IN };
  return jwt.sign(payload, SECRET!, options);
}

// Verifica y decodifica un JWT, o retorna null si no es válido
export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string): T | null {
  try {
    return jwt.verify(token, SECRET!) as T;
  } catch {
    return null;
  }
}

// Re-export para compatibilidad
export type { JwtUser } from "./types";