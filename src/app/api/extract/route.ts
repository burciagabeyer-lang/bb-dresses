import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, imageMime } = body

    if (!imageBase64 || !imageMime) {
      return NextResponse.json({ error: 'imageBase64 e imageMime son requeridos' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
    }

    const system = `Eres un extractor experto de facturas de ropa de fiesta.
Analiza la imagen de una factura y extrae TODOS los vestidos.

INSTRUCCIONES CRÍTICAS:
1. Lee el nombre de la tienda del ENCABEZADO de la factura. Ponlo en "tienda" EXACTAMENTE como aparece.
2. Lee el Invoice # y la Invoice Date del encabezado.
3. Para cada vestido en la tabla Style#/Color:
   - El Style# puede ser alfanumérico como "YSW-24686" o "LV542-1" o "87145". Cópialo COMPLETO.
   - Cada color listado bajo un Style# = una entrada SEPARADA en el array.
   - La talla es el número circulado/marcado en la fila de tallas (02,04,06,08,10,12,14,16,18,20).
   - Si hay varias tallas marcadas del mismo color, crea una entrada por talla.
   - precio_usd = valor del campo U/P (unit price), NO el Amount total.
   - cantidad = 1 por variante salvo que se indique otro número explícito.
4. Extrae TODOS los renglones sin omitir ninguno.

RESPONDE SOLO con JSON válido, sin markdown, sin backticks, sin texto extra:
{
  "tienda": "nombre exacto de la tienda del encabezado",
  "numero_factura": "número",
  "fecha": "YYYY-MM-DD",
  "vestidos": [
    {
      "style_number": "YSW-24686",
      "color": "CHAM/GOLD",
      "talla": "08",
      "cantidad": 1,
      "precio_usd": 319.00,
      "descripcion": "info adicional si existe"
    }
  ]
}`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: imageMime, data: imageBase64 } },
            { type: 'text', text: 'Extrae todos los vestidos de esta factura.' }
          ]
        }]
      })
    })

    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error?.message || `Error ${resp.status}`)

    const raw   = data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ success: true, data: parsed })

  } catch (error: any) {
    console.error('[extract]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
