'use client'
import { useState } from 'react'

const th = {
  bg: '#0D0D0D', surface: '#161616', surfaceAlt: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', text: '#F0EDE8',
  muted: '#888880', success: '#4CAF7D', error: '#E05A4A',
}

function fmtUSD(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}
function fmtMXN(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
}

interface Vestido {
  id: string
  style_number: string
  color: string
  talla: string
  cantidad: number
  precio_usd: number
  descripcion: string
  tienda: string
  vendido: boolean
  facturas?: { numero: string; fecha: string }
}

interface Config {
  tipo_cambio_usd_mxn: number
  markup_porcentaje: number
  cargo_adicional_mxn: number
}

function calcPrecioVenta(precio_usd: number, config: Config): number {
  const enMXN    = precio_usd * config.tipo_cambio_usd_mxn
  const conMark  = enMXN * (1 + config.markup_porcentaje / 100)
  const conCargo = conMark + config.cargo_adicional_mxn
  return Math.ceil(conCargo)
}

export default function ConsultaPage() {
  const [codigo, setCodigo]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [vestidos, setVestidos] = useState<Vestido[] | null>(null)
  const [config, setConfig]     = useState<Config | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [noFound, setNoFound]   = useState(false)

  async function buscar() {
    if (!codigo.trim()) return
    setLoading(true)
    setError(null)
    setNoFound(false)
    setVestidos(null)

    try {
      // Cargar config y vestidos en paralelo
      const [vRes, cRes] = await Promise.all([
        fetch(`/api/vestidos?style=${encodeURIComponent(codigo.trim())}`),
        fetch('/api/config'),
      ])

      const vData = await vRes.json()
      const cData = await cRes.json()

      if (!vRes.ok) throw new Error(vData.error)
      if (!cRes.ok) throw new Error(cData.error)

      setConfig(cData.data)

      if (!vData.data || vData.data.length === 0) {
        setNoFound(true)
      } else {
        setVestidos(vData.data)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') buscar()
  }

  const coloresDisponibles = vestidos?.filter(v => !v.vendido) || []
  const coloresVendidos    = vestidos?.filter(v => v.vendido) || []

  return (
    <div style={{ minHeight: '100vh', background: th.bg }}>
      {/* Header */}
      <div style={{ background: th.surface, borderBottom: `1px solid ${th.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/" style={{ color: th.muted, textDecoration: 'none', fontSize: 20 }}>←</a>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Consultar Vestido</div>
          <div style={{ fontSize: 11, color: th.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Escribe el código de la etiqueta</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px' }}>
        {/* Buscador */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            placeholder="Ej: YSW-24686"
            autoFocus
            style={{
              flex: 1, background: th.surface, border: `1px solid ${th.border}`,
              borderRadius: 10, color: th.text, padding: '14px 16px',
              fontSize: 20, fontFamily: 'monospace', fontWeight: 700,
              outline: 'none', letterSpacing: '0.05em',
            }}
          />
          <button
            onClick={buscar}
            disabled={loading || !codigo.trim()}
            style={{
              background: th.gold, border: 'none', borderRadius: 10,
              color: '#0D0D0D', padding: '14px 22px', fontWeight: 700,
              fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
              opacity: loading || !codigo.trim() ? 0.5 : 1,
            }}
          >
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: `${th.error}18`, border: `1px solid ${th.error}44`, borderRadius: 8, padding: '12px 16px', color: th.error, marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        {/* No encontrado */}
        {noFound && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔎</div>
            <p style={{ color: th.muted, fontSize: 15 }}>No se encontró ningún vestido con el código <strong style={{ color: th.text, fontFamily: 'monospace' }}>{codigo}</strong></p>
            <p style={{ color: th.muted, fontSize: 13, marginTop: 6 }}>Verifica que el código esté escrito correctamente.</p>
          </div>
        )}

        {/* Resultados */}
        {vestidos && config && (
          <div>
            {/* Info del estilo */}
            <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: th.gold }}>{vestidos[0].style_number}</div>
                  <div style={{ fontSize: 13, color: th.muted, marginTop: 2 }}>Tienda: <span style={{ color: th.text }}>{vestidos[0].tienda}</span></div>
                  {vestidos[0].descripcion && <div style={{ fontSize: 13, color: th.muted, marginTop: 2 }}>{vestidos[0].descripcion}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: th.muted, marginBottom: 2 }}>Disponibles</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: coloresDisponibles.length > 0 ? th.success : th.error }}>
                    {coloresDisponibles.length}/{vestidos.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Colores disponibles */}
            {coloresDisponibles.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: th.muted, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                  ✅ Disponibles ({coloresDisponibles.length})
                </div>
                {coloresDisponibles.map(v => (
                  <VestidoCard key={v.id} vestido={v} config={config} calcPrecio={calcPrecioVenta} />
                ))}
              </div>
            )}

            {/* Colores vendidos */}
            {coloresVendidos.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: th.muted, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                  🔴 Vendidos ({coloresVendidos.length})
                </div>
                {coloresVendidos.map(v => (
                  <VestidoCard key={v.id} vestido={v} config={config} calcPrecio={calcPrecioVenta} vendido />
                ))}
              </div>
            )}

            {/* Desglose de precio */}
            {config && coloresDisponibles.length > 0 && (
              <PrecioDesglose vestido={coloresDisponibles[0]} config={config} calcPrecio={calcPrecioVenta} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function VestidoCard({ vestido, config, calcPrecio, vendido = false }: {
  vestido: Vestido, config: Config,
  calcPrecio: (p: number, c: Config) => number,
  vendido?: boolean
}) {
  const precioVenta = calcPrecio(vestido.precio_usd, config)

  return (
    <div style={{
      background: vendido ? `${th.surfaceAlt}88` : th.surfaceAlt,
      border: `1px solid ${vendido ? th.border : '#3A3A3A'}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 8,
      opacity: vendido ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: th.muted }}>Color</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{vestido.color}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: th.muted }}>Talla</div>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>{vestido.talla}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: th.muted }}>Costo</div>
            <div style={{ fontSize: 14, color: th.muted }}>{fmtUSD(vestido.precio_usd)}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: th.muted }}>Precio venta</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: vendido ? th.muted : th.gold }}>{fmtMXN(precioVenta)}</div>
        </div>
      </div>
    </div>
  )
}

function PrecioDesglose({ vestido, config, calcPrecio }: {
  vestido: Vestido, config: Config, calcPrecio: (p: number, c: Config) => number
}) {
  const enMXN   = vestido.precio_usd * config.tipo_cambio_usd_mxn
  const conMark = enMXN * (1 + config.markup_porcentaje / 100)
  const final   = calcPrecio(vestido.precio_usd, config)

  return (
    <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
      <div style={{ fontSize: 11, color: th.muted, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
        💰 Cómo se calcula el precio
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <Row label={`Costo USD (${fmtUSD(vestido.precio_usd)})`} value={`× ${config.tipo_cambio_usd_mxn} = ${fmtMXN(enMXN)}`} />
        <Row label={`Markup ${config.markup_porcentaje}%`} value={`+ ${fmtMXN(enMXN * config.markup_porcentaje / 100)}`} />
        {config.cargo_adicional_mxn > 0 && <Row label="Cargo adicional" value={`+ ${fmtMXN(config.cargo_adicional_mxn)}`} />}
        <div style={{ borderTop: `1px solid ${th.border}`, marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>Precio de venta</span>
          <span style={{ fontWeight: 700, color: th.gold, fontSize: 16 }}>{fmtMXN(final)}</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: th.muted }}>
      <span>{label}</span>
      <span style={{ color: th.text }}>{value}</span>
    </div>
  )
}
