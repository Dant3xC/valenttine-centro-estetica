'use client'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { type LoginResponse, LoginResponseSchema } from '@/lib/usuarios/types'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const nextPath = search.get('next')

  // usamos username + password (≤ 11, sin espacios)
  const [form, setForm] = useState<{ username: string; password: string }>({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null) // mensajes (bienvenida / flash)

  // mostrar mensajes “flash” (logout ok / inactividad)
  useEffect(() => {
    const ok = sessionStorage.getItem('flash')
    const danger = sessionStorage.getItem('flash-danger')
    if (ok) {
      sessionStorage.removeItem('flash')
      setBanner(ok)
      setTimeout(() => setBanner(null), 5000)
    } else if (danger) {
      sessionStorage.removeItem('flash-danger')
      setBanner(danger)
      setTimeout(() => setBanner(null), 5000)
    }
  }, [])

  // validaciones HU: no espacios y máx 11
  const usernameOk =
    form.username.length > 0 &&
    form.username.length <= 11 &&
    !/\s/.test(form.username)

  const passwordOk =
    form.password.length > 0 &&
    form.password.length <= 11 &&
    !/\s/.test(form.password)

  const canSubmit = usernameOk && passwordOk && !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), // { username, password }
      })
      const json = await res.json()
      const parsed = LoginResponseSchema.safeParse(json)
      if (!parsed.success) {
        setError('Respuesta inesperada del servidor')
        return
      }
      const data: LoginResponse = parsed.data
      if ('error' in data) {
        setError(data.error)
        return
      }

      // Bienvenida 5s y redirección
      setBanner(`Bienvenido, ${data.role}`)
      setTimeout(() => {
        if (nextPath) return router.replace(nextPath)
        if (data.role === 'RECEPCIONISTA') router.replace('/dashboard')
        else if (data.role === 'MEDICO')   router.replace('/dashboard')
        else                                router.replace('/dashboard')
      }, 5000)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Izquierda (hero) — diseño intacto */}
      <div className="flex-1 gradient-animated flex flex-col justify-center items-center text-white p-8 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-300/10 rounded-full blur-lg" />
        <div className="absolute top-1/2 left-5 w-16 h-16 bg-indigo-300/10 rounded-full blur-md" />

        <div className="text-center max-w-lg relative z-10 hero-content">
          <div className="mb-12 relative">
            <div className="absolute inset-0 w-32 h-32 mx-auto">
              <div className="w-full h-full bg-white/20 rounded-full pulse-ring" />
            </div>
            <div className="absolute inset-0 w-32 h-32 mx-auto">
              <div
                className="w-full h-full bg-purple-300/20 rounded-full pulse-ring"
                style={{ animationDelay: '.5s' }}
              />
            </div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-white to-purple-100 rounded-full flex items-center justify-center mb-6 logo-float glow-effect">
              <Image
                src="/imagen/Logo_Valenttine.png"
                alt="Logo Valenttine"
                width={100}
                height={100}
                className="w-220 h-220 object-contain"
                priority
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold font-display text-white/90 leading-tight">
                Centro Médico
              </h1>
              <h2 className="text-3xl font-bold font-display text-purple-200 tracking-wide">
                Estético
              </h2>
              <div className="relative">
                <h3 className="text-5xl font-extrabold font-display bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  Valenttine
                </h3>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-xl text-purple-100 leading-relaxed font-medium">
                Bienvenido a tu plataforma de gestión de salud
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" />
                <div
                  className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"
                  style={{ animationDelay: '.2s' }}
                />
                <div
                  className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"
                  style={{ animationDelay: '.4s' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: '🏥', label: 'Atención Integral' },
                { icon: '👨‍⚕️', label: 'Profesionales' },
                { icon: '💙', label: 'Cuidado Humano' },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-white/20 rounded-xl flex items-center justify-center mb-2">
                    <span className="text-2xl">{f.icon}</span>
                  </div>
                  <p className="text-sm text-purple-200">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Derecha (form) — diseño intacto, cambia a username */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-bl from-gray-50 to-white">
        <div className="w-full max-w-md form-slide-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Iniciar Sesión
              </h3>
              <p className="text-gray-500">Accede a tu cuenta del sistema</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Nombre de usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        username: e.target.value.replace(/\s/g, '').slice(0, 11),
                      }))
                    }
                    placeholder="Ingrese su usuario"
                    className="pl-12 py-4"
                    maxLength={11}
                    autoComplete="username"
                  />
                </div>
                {form.username.length > 0 && (
                  <div className="mt-2 text-sm">
                    {usernameOk ? (
                      <span className="text-green-600 font-medium">Usuario válido</span>
                    ) : (
                      <span className="text-red-600 font-medium">Usuario inválido</span>
                    )}
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1S15.1 4.29 15.1 6v2z" />
                    </svg>
                  </div>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        password: e.target.value.replace(/\s/g, '').slice(0, 11),
                      }))
                    }
                    placeholder="Ingrese su contraseña"
                    className="pl-12 py-4"
                    maxLength={11}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm -mt-2">{error}</p>}
              {banner && (
                <p
                  className={`text-sm -mt-2 rounded px-3 py-2 ${
                    banner.includes('inactividad') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}
                >
                  {banner}
                </p>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className={
                    canSubmit
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                      : ''
                  }
                >
                  <span className="flex items-center justify-center">
                    {loading ? (
                      <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path d="M4 12a8 8 0 018-8" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 17l5-5-5-5v3H3v4h7v3zm11-14h-9l3.59 3.59L9 13.17V15h2v-1.17l6.59-6.59L21 11V3z" />
                      </svg>
                    )}
                    Acceder
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
