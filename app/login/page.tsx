'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function resetMessages() {
    setError(null)
    setInfo(null)
  }

  function switchMode(next: Mode) {
    setMode(next)
    resetMessages()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setInfo('Akun berhasil dibuat. Silakan cek email untuk konfirmasi, lalu login.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        setError(error.message)
      } else {
        setInfo('Link reset password sudah dikirim ke email kamu. Cek inbox (atau folder spam) ya.')
      }
    }
    setLoading(false)
  }

  return (
    <main
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #16866a 0%, #0f6650 45%, #0a4a3a 100%)' }}
    >
      {/* Dekorasi lingkaran blur ala app finance modern */}
      <div className="absolute rounded-full" style={{ width: 260, height: 260, top: -80, left: -80, background: 'rgba(255,255,255,0.07)' }} />
      <div className="absolute rounded-full" style={{ width: 180, height: 180, top: 40, right: -60, background: 'rgba(255,255,255,0.06)' }} />

      <div className="flex flex-col items-center pt-12 pb-8 px-6 relative">
        <div className="w-24 h-24 rounded-[28px] overflow-hidden mb-4 shadow-xl" style={{ boxShadow: '0 12px 30px -8px rgba(0,0,0,0.35)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-512.png" alt="FinCloud" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">FinCloud</h1>
        <p className="text-sm mt-1 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Cukup chat, AI yang catat pengeluaranmu
        </p>
      </div>

      <div
        className="flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-10 relative"
        style={{ boxShadow: '0 -8px 30px -12px rgba(0,0,0,0.25)' }}
      >
        <div className="w-full max-w-sm mx-auto">
          {mode !== 'forgot' && (
            <div className="flex mb-6 rounded-xl overflow-hidden p-1" style={{ background: 'var(--bg)' }}>
              <button
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                style={{
                  background: mode === 'login' ? 'var(--primary)' : 'transparent',
                  color: mode === 'login' ? '#fff' : 'var(--ink-soft)',
                }}
                onClick={() => switchMode('login')}
                type="button"
              >
                Masuk
              </button>
              <button
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                style={{
                  background: mode === 'signup' ? 'var(--primary)' : 'transparent',
                  color: mode === 'signup' ? '#fff' : 'var(--ink-soft)',
                }}
                onClick={() => switchMode('signup')}
                type="button"
              >
                Daftar
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-5">
              <h2 className="text-lg font-semibold mb-1">Lupa password?</h2>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                Masukkan email akunmu, kami kirim link untuk atur ulang password.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-soft)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 text-sm rounded-xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  placeholder="kamu@email.com"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-soft)' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 text-sm rounded-xl"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Lupa password?
              </button>
            )}

            {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
            {info && <p className="text-sm" style={{ color: 'var(--primary)' }}>{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 text-white"
              style={{ background: 'var(--primary)' }}
            >
              {loading
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk'
                : mode === 'signup'
                ? 'Buat akun'
                : 'Kirim link reset'}
              {!loading && <ArrowRight size={16} />}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-medium w-full text-center pt-1"
                style={{ color: 'var(--ink-soft)' }}
              >
                ← Kembali ke halaman masuk
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
