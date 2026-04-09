import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/vestidos/aplicar-global
// Aplica tipo_cambio, markup y cargo a TODOS los vestidos
export async function POST(request: NextRequest) {
  try {
    const { tipo_cambio, markup, cargo } = await request.json()
    if (tipo_cambio == null || markup == null || cargo == null) {
      return NextResponse.json({ error: 'tipo_cambio, markup y cargo son requeridos' }, { status: 400 })
    }
    const { error } = await supabase
      .from('vestidos')
      .update({
        tipo_cambio_custom: parseFloat(tipo_cambio),
        markup_custom:      parseFloat(markup),
        cargo_custom:       parseFloat(cargo),
      })
      .not('id', 'is', null)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
