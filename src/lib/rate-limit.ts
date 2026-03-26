/**
 * Rate Limiter simple para prevenir brute force attacks
 * 
 * Usa un Map en memoria con timestamps.
 * Para producción, usar Redis o similar.
 * 
 * Limit: 5 intentos por IP en ventana de 15 minutos
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp cuando se resetea
}

type RateLimitKey = string; // Usually IP address

// In-memory store (se resetea con cada restart del server)
// Para producción: usar Redis o similar
const store = new Map<RateLimitKey, RateLimitEntry>();

// Configuración
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // segundos hasta reset
}

/**
 * Verifica si un request está permitido bajo rate limiting
 * 
 * @param key - Identificador único (normalmente IP)
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(key: RateLimitKey): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // Si no existe o ya expiró, crear nueva entrada
  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      resetIn: Math.ceil(WINDOW_MS / 1000),
    };
  }

  // Incrementar contador
  entry.count++;

  // Si excedió el límite, denegar
  if (entry.count > MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Obtiene la IP del request
 * Maneja proxies (X-Forwarded-For) y requests directos
 */
export function getClientIP(request: Request): string {
  // Headers comunes para IP en proxies
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For puede tener múltiples IPs: "client, proxy1, proxy2"
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // Fallback: unknown
  return "unknown";
}

/**
 * Limpia entradas expiradas del store
 * Llamar periódicamente o en cada request (overhead bajo)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

// Cleanup automático cada 5 minutos (en background)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Reset del rate limit para testing
 */
export function resetRateLimit(key?: RateLimitKey): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}

/**
 * Para testing: permite setear el store directamente
 */
export function _setStore(newStore: Map<RateLimitKey, RateLimitEntry>): void {
  store.clear();
  for (const [k, v] of newStore) {
    store.set(k, v);
  }
}
