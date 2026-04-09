import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/vestidos?style=YSW-24686
// GET /api/vestidos?all=true
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const style = searchParams.get('style')
  const all   = searchParams.get('all')

  try {
    if (style) {
      // Buscar vestido por style_number
      const { data, error } = await supabase
        .from('vestidos')
        .select('*')
        .ilike('style_number', `%${style.trim()}%`)
        .order('color')

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    if (all === 'true') {
      // Todos los vestidos para el inventario
      const { data, error } = await supabase
        .from('vestidos')
        .select(`*, facturas(numero, fecha), tipo_cambio_custom, markup_custom, cargo_custom`)
        .order('tienda')
        .order('style_number')
        .order('color')

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Parámetro requerido: style o all' }, { status: 400 })

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

// PATCH /api/vestidos — vender o devolver una pieza
// accion: 'vender' → cantidad-1; si llega a 0, vendido=true
// accion: 'devolver' → cantidad+1, vendido=false
export async function PATCH(request: NextRequest) {
  try {
    const { id, accion } = await request.json()
    if (!id || !accion) return NextResponse.json({ error: 'id y accion requeridos' }, { status: 400 })

    // Leer cantidad actual desde DB
    const { data: current, error: readError } = await supabase
      .from('vestidos')
      .select('cantidad')
      .eq('id', id)
      .single()
    if (readError) throw readError

    const cantidadActual = parseInt(current.cantidad) || 0
    let update: Record<string, any>

    if (accion === 'vender') {
      const nuevaCantidad = Math.max(0, cantidadActual - 1)
      update = {
        cantidad:   nuevaCantidad,
        vendido:    nuevaCantidad === 0,
        vendido_at: nuevaCantidad === 0 ? new Date().toISOString() : null,
      }
    } else if (accion === 'devolver') {
      update = {
        cantidad:   cantidadActual + 1,
        vendido:    false,
        vendido_at: null,
      }
    } else {
      return NextResponse.json({ error: 'accion debe ser vender o devolver' }, { status: 400 })
    }

    const { error } = await supabase.from('vestidos').update(update).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, ...update })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
