import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions, JwtPayload } from "jsonwebtoken";

const SECRET: Secret = (process.env.JWT_SECRET ?? "") as Secret;
const EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES as SignOptions["expiresIn"]) ?? "1d";

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// firma el JWT (no expone la contraseña, solo el payload que le pases)
export function signJwt(payload: object) {
  const options: SignOptions = { expiresIn: EXPIRES_IN };
  return jwt.sign(payload, SECRET, options);
}

// Verifica y decodifica un JWT, o retorna null si no es válido
export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string): T | null {
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}

// Tipo de usuario que se guarda en el JWT
export type JwtUser = {
  sub: string;
  email: string;
  role: "RECEPTION" | "SPECIALIST" | "ADMIN";
  profId?: number; 
};