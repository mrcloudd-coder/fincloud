'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react'

type Request = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  email: string
  proofUrl: string | null
}

export default function AdminPaymentsClient({ requests }: { requests: Request[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/${action}-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoadingId(null)
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const others = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <div>
        <h2 className="text-sm font-medium mb-3">Menunggu review ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm py-6 text-center card" style={{ color: 'var(--ink-soft)' }}>
            Gak ada yang perlu direview sekarang.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">{r.email}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                      {new Date(r.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                    <Clock size={12} />
                    Pending
                  </span>
                </div>

                {r.proofUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.proofUrl} alt="Bukti transfer" className="w-full max-h-80 object-contain rounded-lg mb-3" style={{ background: 'var(--bg)' }} />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, 'approve')}
                    disabled={loadingId === r.id}
                    className="btn-primary flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Check size={15} />
                    {loadingId === r.id ? 'Memproses...' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'reject')}
                    disabled={loadingId === r.id}
                    className="btn-secondary px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
                    style={{ color: 'var(--danger)' }}
                  >
                    <X size={15} />
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3">Riwayat</h2>
          <div className="flex flex-col gap-2">
            {others.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                <div>
                  <p className="text-sm">{r.email}</p>
                  <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                    {new Date(r.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                {r.status === 'approved' ? (
                  <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                    <CheckCircle2 size={12} />
                    Aktif
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: '#fdeeee', color: 'var(--danger)' }}>
                    <XCircle size={12} />
                    Ditolak
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
