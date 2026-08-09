import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseExpenseChat } from '@/lib/gemini'
import { getSubscriptionInfo, FREE_TIER_LIMITS } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  }

  const { text, referenceDate } = await req.json()

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Chat tidak boleh kosong' }, { status: 400 })
  }

  const subscription = await getSubscriptionInfo(supabase, user.id)

  // === Kalau user TIDAK punya akses penuh (trial habis, belum langganan) ===
  if (!subscription.hasFullAccess) {
    // 1. Batasi jumlah kata per chat, biar user tidak numpuk banyak transaksi
    //    sekaligus dalam satu chat untuk akalin limit harian.
    const wordCount = text.trim().split(/\s+/).length
    if (wordCount > FREE_TIER_LIMITS.maxWordsPerChat) {
      return NextResponse.json(
        {
          error: `Mode gratis dibatasi maksimal ${FREE_TIER_LIMITS.maxWordsPerChat} kata per chat. Upgrade ke Premium untuk chat tanpa batas.`,
          limitReached: true,
        },
        { status: 403 }
      )
    }

    // 2. Cek & catat jatah chat harian (maks 1x/hari untuk user gratis)
    const today = new Date().toISOString().slice(0, 10)
    const { data: usage } = await supabase
      .from('daily_chat_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle()

    if (usage && usage.count >= FREE_TIER_LIMITS.maxChatPerDay) {
      return NextResponse.json(
        {
          error: 'Jatah chat gratis hari ini sudah habis. Coba lagi besok, atau upgrade ke Premium untuk chat tanpa batas.',
          limitReached: true,
        },
        { status: 403 }
      )
    }

    // Catat pemakaian (upsert: kalau belum ada baris hari ini, buat baru)
    await supabase
      .from('daily_chat_usage')
      .upsert(
        { user_id: user.id, usage_date: today, count: (usage?.count ?? 0) + 1 },
        { onConflict: 'user_id,usage_date' }
      )
  }

  // Ambil kategori yang sudah ada milik user, biar AI konsisten memakainya
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', user.id)

  const categoryNames = (categories ?? []).map((c) => c.name)

  try {
    const results = await parseExpenseChat(text, categoryNames, referenceDate)
    return NextResponse.json({ transactions: results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat parsing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
