import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/vestidos?style=YSW-24686
// GET /api/vestidos?all=true
// GET /api/vestidos?repair=true  — limpia cantidad_vendida NULL o negativa
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const style  = searchParams.get('style')
  const all    = searchParams.get('all')
  const repair = searchParams.get('repair')

  try {
    if (repair === 'true') {
      const { error } = await supabase
        .from('vestidos')
        .update({ cantidad_vendida: 0 })
        .or('cantidad_vendida.is.null,cantidad_vendida.lt.0')
      if (error) throw error
      return NextResponse.json({ success: true, repaired: true })
    }

    if (style) {
      const { data, error } = await supabase
        .from('vestidos')
        .select('*')
        .ilike('style_number', `%${style.trim()}%`)
        .order('color')

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    if (all === 'true') {
      const { data, error } = await supabase
        .from('vestidos')
        .select(`*, facturas(numero, fecha), tipo_cambio_custom, markup_custom, cargo_custom`)
        .order('tienda')
        .order('style_number')
        .order('color')

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Parámetro requerido: style, all o repair' }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/vestidos — guardar factura completa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { factura, vestidos } = body

    if (!factura?.tienda || !vestidos?.length) {
      return NextResponse.json({ error: 'Factura y vestidos son requeridos' }, { status: 400 })
    }

    // 1. Insertar factura
    const totalUSD = vestidos.reduce((s: number, v: any) =>
      s + (parseFloat(v.precio_usd) || 0) * (parseInt(v.cantidad) || 1), 0)

    const { data: facturaData, error: facturaError } = await supabase
      .from('facturas')
      .insert({
        tienda:    factura.tienda,
        numero:    factura.numero_factura || null,
        fecha:     factura.fecha && /^\d{4}-\d{2}-\d{2}$/.test(factura.fecha) ? factura.fecha : null,
        total_usd: totalUSD,
      })
      .select()
      .single()

    if (facturaError) throw facturaError

    // 2. Insertar vestidos
    const vestidosRows = vestidos.map((v: any) => ({
      factura_id:   facturaData.id,
      tienda:       factura.tienda,
      style_number: v.style_number,
      color:        v.color,
      talla:        v.talla,
      cantidad:     parseInt(v.cantidad) || 1,
      precio_usd:   parseFloat(v.precio_usd) || 0,
      descripcion:  v.descripcion || null,
    }))

    const { data: vestidosData, error: vestidosError } = await supabase
      .from('vestidos')
      .insert(vestidosRows)
      .select()

    if (vestidosError) throw vestidosError

    return NextResponse.json({
      success: true,
      factura_id: facturaData.id,
      vestidos_guardados: vestidosData.length,
    })

  } catch (error: any) {
    console.error('[vestidos POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/vestidos — actualizar campos de un vestido individual
export async function PUT(request: NextRequest) {
  try {
    const { id, ...campos } = await request.json()
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    const camposValidos = ['style_number','color','talla','cantidad','precio_usd','descripcion','tienda','notas','tipo_cambio_custom','markup_custom','cargo_custom']
    const update = Object.fromEntries(Object.entries(campos).filter(([k]) => camposValidos.includes(k)))
    const { error } = await supabase.from('vestidos').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, accion } = await request.json()
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    if (accion === 'vender') {
      const { data, error } = await supabase.rpc('vender_pieza', { p_id: id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const result = typeof data === 'string' ? JSON.parse(data) : data
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true, cantidad: result.cantidad, cantidad_vendida: result.cantidad_vendida, vendido: result.vendido })
    }

    if (accion === 'devolver') {
      const { data, error } = await supabase.rpc('devolver_pieza', { p_id: id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const result = typeof data === 'string' ? JSON.parse(data) : data
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true, cantidad: result.cantidad, cantidad_vendida: result.cantidad_vendida, vendido: result.vendido })
    }

    // PATCH genérico para editar campos
    const body = await request.json().catch(() => ({}))
    const { id: _id, accion: _ac, ...campos } = { id, accion, ...body }
    const camposValidos = ['style_number','color','talla','cantidad','precio_usd','descripcion','tienda','notas','tipo_cambio_custom','markup_custom','cargo_custom']
    const update = Object.fromEntries(Object.entries(campos).filter(([k]) => camposValidos.includes(k)))
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 })
    const { error } = await supabase.from('vestidos').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
