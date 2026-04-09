import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/config
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configuracion_precios')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/config — actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo_cambio_usd_mxn, markup_porcentaje, cargo_adicional_mxn, notas } = body

    const { error } = await supabase
      .from('configuracion_precios')
      .update({
        tipo_cambio_usd_mxn: parseFloat(tipo_cambio_usd_mxn),
        markup_porcentaje:   parseFloat(markup_porcentaje),
        cargo_adicional_mxn: parseFloat(cargo_adicional_mxn),
        notas:               notas || null,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
