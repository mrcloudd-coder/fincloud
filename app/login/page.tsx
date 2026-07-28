'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'signup_otp' | 'forgot' | 'forgot_otp'

function describeError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    // Kadang Supabase membalas body JSON yang rusak/kosong (misal kalau ada
    // error di sisi server saat proses kirim email), dan library-nya jatuh
    // ke fallback berupa string JSON mentah seperti "{}" atau "[]" — itu
    // bukan pesan yang berguna buat user, jadi kita saring juga.
    if (typeof msg === 'string' && msg.trim() && !/^[[{].{0,3}[\]}]$/.test(msg.trim())) {
      return msg
    }
  }
  console.error('Auth error:', err)
  return 'Gagal mengirim email. Kemungkinan ada masalah di setup SMTP atau template email — cek Supabase Dashboard > Logs > Auth Logs untuk detailnya.'
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(describeError(error))
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  // Langkah 1 daftar: kirim kode verifikasi ke email
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(describeError(error))
    } else {
      setOtp('')
      setMode('signup_otp')
      setInfo(`Kode verifikasi 6 digit sudah dikirim ke ${email}. Cek inbox atau folder spam.`)
    }
  }

  // Langkah 2 daftar: verifikasi kode → akun aktif & langsung login
  async function handleVerifySignup(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
    setLoading(false)
    if (error) {
      setError('Kode salah atau sudah kedaluwarsa. Coba minta kode baru.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleResendSignupOtp() {
    resetMessages()
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    if (error) {
      setError(describeError(error))
    } else {
      setInfo('Kode baru sudah dikirim.')
    }
  }

  // Langkah 1 lupa password: kirim kode reset ke email
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      setError(describeError(error))
    } else {
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setMode('forgot_otp')
      setInfo(`Kode reset 6 digit sudah dikirim ke ${email}. Cek inbox atau folder spam.`)
    }
  }

  // Langkah 2 lupa password: verifikasi kode + set password baru sekaligus
  async function handleVerifyForgot(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)
    const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' })
    if (verifyErr) {
      setLoading(false)
      setError('Kode salah atau sudah kedaluwarsa. Coba minta kode baru.')
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (updateErr) {
      setError(describeError(updateErr))
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleResendForgotOtp() {
    resetMessages()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      setError(describeError(error))
    } else {
      setInfo('Kode baru sudah dikirim.')
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>
            FinCloud
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            Cukup chat, AI yang catat pengeluaranmu
          </p>
        </div>

        <div className="card p-6">
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex mb-6 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <button
                className={`flex-1 py-2 text-sm font-medium ${mode === 'login' ? 'text-white' : ''}`}
                style={{ background: mode === 'login' ? 'var(--primary)' : 'transparent' }}
                onClick={() => switchMode('login')}
                type="button"
              >
                Masuk
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${mode === 'signup' ? 'text-white' : ''}`}
                style={{ background: mode === 'signup' ? 'var(--primary)' : 'transparent' }}
                onClick={() => switchMode('signup')}
                type="button"
              >
                Daftar
              </button>
            </div>
          )}

          {/* ===== MASUK ===== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="kamu@email.com" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Password</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="Minimal 6 karakter" />
              </div>
              <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                Lupa password?
              </button>
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              {info && <p className="text-sm" style={{ color: 'var(--primary)' }}>{info}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-medium">
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          )}

          {/* ===== DAFTAR — LANGKAH 1: isi data ===== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="kamu@email.com" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Password</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="Minimal 6 karakter" />
              </div>
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-medium">
                {loading ? 'Memproses...' : 'Buat akun'}
              </button>
            </form>
          )}

          {/* ===== DAFTAR — LANGKAH 2: verifikasi kode ===== */}
          {mode === 'signup_otp' && (
            <form onSubmit={handleVerifySignup} className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                Masukkan kode 6 digit yang dikirim ke <strong style={{ color: 'var(--ink)' }}>{email}</strong>
              </p>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Kode verifikasi</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-semibold"
                  placeholder="------"
                />
              </div>
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              {info && <p className="text-sm" style={{ color: 'var(--primary)' }}>{info}</p>}
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-2.5 text-sm font-medium">
                {loading ? 'Memverifikasi...' : 'Verifikasi & masuk'}
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button type="button" onClick={() => switchMode('signup')} style={{ color: 'var(--ink-soft)' }}>
                  ← Ganti email
                </button>
                <button type="button" onClick={handleResendSignupOtp} disabled={loading} style={{ color: 'var(--primary)' }} className="font-medium">
                  Kirim ulang kode
                </button>
              </div>
            </form>
          )}

          {/* ===== LUPA PASSWORD — LANGKAH 1: isi email ===== */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                Masukkan email akunmu, kami kirim kode 6 digit untuk atur ulang password.
              </p>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="kamu@email.com" />
              </div>
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-medium">
                {loading ? 'Memproses...' : 'Kirim kode reset'}
              </button>
              <button type="button" onClick={() => switchMode('login')} className="text-xs font-medium w-full text-center" style={{ color: 'var(--ink-soft)' }}>
                ← Kembali ke halaman masuk
              </button>
            </form>
          )}

          {/* ===== LUPA PASSWORD — LANGKAH 2: kode + password baru ===== */}
          {mode === 'forgot_otp' && (
            <form onSubmit={handleVerifyForgot} className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                Masukkan kode dari <strong style={{ color: 'var(--ink)' }}>{email}</strong> dan password barumu
              </p>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Kode reset</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-semibold"
                  placeholder="------"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Password baru</label>
                <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="Minimal 6 karakter" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>Konfirmasi password</label>
                <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 text-sm" placeholder="Ulangi password baru" />
              </div>
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              {info && <p className="text-sm" style={{ color: 'var(--primary)' }}>{info}</p>}
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-2.5 text-sm font-medium">
                {loading ? 'Memproses...' : 'Ubah password & masuk'}
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button type="button" onClick={() => switchMode('forgot')} style={{ color: 'var(--ink-soft)' }}>
                  ← Ganti email
                </button>
                <button type="button" onClick={handleResendForgotOtp} disabled={loading} style={{ color: 'var(--primary)' }} className="font-medium">
                  Kirim ulang kode
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
