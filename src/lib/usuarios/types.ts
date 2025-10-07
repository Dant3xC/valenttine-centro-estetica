import { z } from "zod";

// Roles de usuario
export const Roles = ["RECEPCIONISTA","MEDICO","GERENTE"] as const;
export type Role = typeof Roles[number];

// ← ÚNICA definición de JwtUser en todo el código
export type JwtUser = {
  sub: string;           // userId
  email: string;
  role: Role;
  username: string;
  profId?: number;       // ID del Profesional si el usuario es MEDICO
};

// --- Login por usuario ---
export const LoginBodySchema = z.object({
  username: z.string().min(1).max(11).regex(/^\S+$/, "sin espacios"),
  password: z.string().min(1).max(11).regex(/^\S+$/, "sin espacios"),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;

export const UserPublicSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(Roles),
});

export const LoginSuccessSchema = z.object({
  message: z.string().optional(),
  role: z.enum(Roles),
  user: UserPublicSchema,
  token: z.string(),
});
export type LoginSuccess = z.infer<typeof LoginSuccessSchema>;

export const ErrorSchema = z.object({ error: z.string() });
export type ErrorResponse = z.infer<typeof ErrorSchema>;

export const LoginResponseSchema = z.union([LoginSuccessSchema, ErrorSchema]);
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
