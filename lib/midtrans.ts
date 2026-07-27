const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const SNAP_API_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

export const SUBSCRIPTION_PRICE = 15000 // Rp15.000/bulan
export const SUBSCRIPTION_DAYS = 30

/**
 * Bikin transaksi Midtrans Snap, return token untuk dipakai di popup
 * pembayaran sisi client (window.snap.pay(token)).
 */
export async function createSnapTransaction(orderId: string, userEmail: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY belum di-set di environment variables')
  }

  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')

  const res = await fetch(SNAP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: orderId,
        gross_amount: SUBSCRIPTION_PRICE,
      },
      customer_details: {
        email: userEmail,
      },
      item_details: [
        {
          id: 'langganan-bulanan',
          price: SUBSCRIPTION_PRICE,
          quantity: 1,
          name: 'Langganan FinCloud (30 hari)',
        },
      ],
      credit_card: { secure: true },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Midtrans error (${res.status}): ${errText}`)
  }

  return res.json() as Promise<{ token: string; redirect_url: string }>
}

/**
 * Verifikasi signature notifikasi webhook dari Midtrans, memastikan
 * request beneran dari Midtrans dan bukan dipalsukan pihak lain.
 */
export async function verifyMidtransSignature(payload: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY belum di-set')

  const raw = payload.order_id + payload.status_code + payload.gross_amount + serverKey
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(raw))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return computedSignature === payload.signature_key
}

export function getSnapJsUrl() {
  return IS_PRODUCTION ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js'
}
