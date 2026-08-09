'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export default function SignupConfirmedPage() {
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'unclear'>('checking')
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Supabase otomatis menaruh access_token di URL (fragment) setelah user
    // klik link konfirmasi, dan supabase-js otomatis membaca + menyimpannya
    // jadi sesi login begitu client ini mount. Kita tinggal cek hasilnya.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? null)
        setStatus('confirmed')
      } else {
        // Sesi belum kebaca kemungkinan karena race condition sesaat,
        // coba sekali lagi setelah delay singkat sebelum menyerah.
        setTimeout(async () => {
          const { data: retry } = await supabase.auth.getUser()
          if (retry.user) {
            setEmail(retry.user.email ?? null)
            setStatus('confirmed')
          } else {
            setStatus('unclear')
          }
        }, 1200)
      }
    })
  }, [supabase])

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="card p-8">
          {status === 'checking' && (
            <>
              <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--primary)' }} />
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Memverifikasi akun kamu...</p>
            </>
          )}

          {status === 'confirmed' && (
            <>
              <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
              <h1 className="text-lg font-semibold mb-1">Akun kamu sudah dikonfirmasi!</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
                {email ? <>Email <strong>{email}</strong> berhasil diverifikasi.</> : 'Email kamu berhasil diverifikasi.'}
                {' '}Sekarang kamu sudah bisa mulai pakai FinCloud.
              </p>
              <Link href="/dashboard" className="btn-primary w-full py-3 text-sm font-semibold inline-block">
                Lanjut ke Beranda
              </Link>
            </>
          )}

          {status === 'unclear' && (
            <>
              <XCircle size={44} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <h1 className="text-lg font-semibold mb-1">Link sudah diproses</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
                Kalau link ini sudah pernah dibuka sebelumnya, akun kamu kemungkinan sudah aktif.
                Silakan coba masuk langsung.
              </p>
              <Link href="/login" className="btn-primary w-full py-3 text-sm font-semibold inline-block">
                Masuk sekarang
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
