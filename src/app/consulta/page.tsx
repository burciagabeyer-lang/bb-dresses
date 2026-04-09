'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

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
function calcMXN(usd: number, cfg: any): number | null {
  if (!cfg) return null
  const enMXN   = usd * parseFloat(cfg.tipo_cambio_usd_mxn || '0')
  const conMark = enMXN * (1 + parseFloat(cfg.markup_porcentaje || '0') / 100)
  return Math.ceil(conMark + parseFloat(cfg.cargo_adicional_mxn || '0'))
}

// ── Splash ────────────────────────────────────────────────────
function Splash({ onDone }: { onDone: () => void }) {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const d = setInterval(() => setDots(p => p.length >= 3 ? '.' : p + '.'), 500)
    const t = setTimeout(onDone, 3000)
    return () => { clearInterval(d); clearTimeout(t) }
  }, [onDone])
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`
        @keyframes pulse{0%,100%{filter:drop-shadow(0 0 4px #C9A84C) brightness(1)}50%{filter:drop-shadow(0 0 28px #C9A84C) brightness(1.3)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
      `}</style>
      <div style={{ fontSize: 88, animation: 'pulse 1.6s ease-in-out infinite', lineHeight: 1 }}>👗</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#F0EDE8', letterSpacing: '0.04em' }}>BB Dresses</div>
        <div style={{ fontSize: 14, color: '#888880', marginTop: 10 }}>Cargando{dots}</div>
      </div>
    </div>
  )
}

// ── Card de estilo (agrupa variantes) ─────────────────────────
function StyleCard({ vestidos, config }: { vestidos: any[]; config: any }) {
  const [sel, setSel] = useState(0)
  const v   = vestidos[Math.min(sel, vestidos.length - 1)]
  const mxn = calcMXN(parseFloat(v?.precio_usd) || 0, config)

  return (
    <div style={{
      background: th.surface, border: `1px solid ${th.border}`,
      borderRadius: 20, marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {/* Placeholder imagen */}
      <div style={{ background: th.surfaceAlt, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${th.border}` }}>
        <span style={{ fontSize: 76 }}>👗</span>
      </div>

      <div style={{ padding: '18px 18px 22px' }}>
        {/* Header: style# + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 20, color: th.gold }}>{vestidos[0]?.style_number || 'Sin código'}</div>
          <span style={{
            background: v?.vendido ? `${th.error}22` : `${th.success}22`,
            color: v?.vendido ? th.error : th.success,
            border: `1px solid ${v?.vendido ? th.error : th.success}44`,
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
          }}>{v?.vendido ? 'Vendido' : 'Disponible'}</span>
        </div>

        {v?.descripcion && (
          <div style={{ fontSize: 13, color: th.muted, marginBottom: 14, lineHeight: 1.5 }}>{v.descripcion}</div>
        )}

        {/* Chips seleccionables (múltiples variantes) */}
        {vestidos.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {vestidos.map((vv, i) => (
              <button key={i} onClick={() => setSel(i)} style={{
                background: sel === i ? th.gold : th.surfaceAlt,
                border: `1px solid ${sel === i ? th.gold : th.border}`,
                borderRadius: 20, padding: '7px 16px', fontSize: 13,
                color: sel === i ? '#0D0D0D' : th.text,
                cursor: 'pointer', fontFamily: 'system-ui', fontWeight: sel === i ? 700 : 400,
                transition: 'all .15s',
              }}>
                {vv.color} · <span style={{ fontFamily: 'monospace' }}>{vv.talla}</span>
              </button>
            ))}
          </div>
        )}

        {/* Badge color + talla (variante única) */}
        {vestidos.length === 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ background: `${th.gold}22`, color: th.gold, border: `1px solid ${th.gold}44`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>{v?.color}</span>
            <span style={{ background: th.surfaceAlt, color: th.text, border: `1px solid ${th.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontFamily: 'monospace' }}>Talla {v?.talla}</span>
          </div>
        )}

        {/* Precio */}
        <div style={{ background: th.surfaceAlt, borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: th.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 3 }}>Costo</div>
            <div style={{ fontSize: 14, color: th.muted }}>{fmtUSD(parseFloat(v?.precio_usd) || 0)}</div>
          </div>
          {mxn !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: th.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 3 }}>Precio venta</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: th.success }}>{fmtMXN(mxn)}</div>
            </div>
          )}
        </div>

        {v?.tienda && <div style={{ fontSize: 11, color: th.muted, marginTop: 10 }}>Tienda: {v.tienda}</div>}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function ConsultaPage() {
  const [ready, setReady]       = useState(false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<any[]>([])
  const [config, setConfig]     = useState<any>(null)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doneSplash = useCallback(() => setReady(true), [])

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => setConfig(d.data || null))
  }, [])

  function handleChange(val: string) {
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!val.trim()) { setResults([]); setSearched(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/vestidos?style=${encodeURIComponent(val.trim())}`)
        const d = await r.json()
        setResults(d.data || [])
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  // Agrupar por style_number
  const groups: Record<string, any[]> = {}
  results.forEach(v => {
    const k = v.style_number || 'Sin código'
    if (!groups[k]) groups[k] = []
    groups[k].push(v)
  })

  if (!ready) return <Splash onDone={doneSplash} />

  return (
    <div style={{ minHeight: '100vh', background: th.bg, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ background: th.surface, padding: '14px 20px', borderBottom: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <a href="/" style={{ color: th.muted, textDecoration: 'none', fontSize: 22, lineHeight: 1 }}>←</a>
        <span style={{ fontWeight: 700, fontSize: 18 }}>BB Dresses</span>
      </div>

      {/* Search */}
      <div style={{ padding: '22px 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', fontSize: 17, pointerEvents: 'none' }}>🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Escribe el código del vestido..."
            style={{
              width: '100%', background: th.surface, border: `1.5px solid ${query ? th.gold : th.border}`,
              borderRadius: 14, color: th.text, padding: '15px 44px',
              fontSize: 16, fontFamily: 'inherit', outline: 'none',
              transition: 'border-color .2s',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: th.muted, cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}>
              ✕
            </button>
          )}
        </div>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <div style={{ width: 22, height: 22, border: `2.5px solid ${th.border}`, borderTop: `2.5px solid ${th.gold}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ padding: '8px 16px 48px' }}>
        {!query && !loading && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: th.muted }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👗</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: th.text }}>Consulta un vestido</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>Escribe el código o parte del número de estilo<br />y los resultados aparecen al instante</div>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: th.muted }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔎</div>
            <div style={{ fontSize: 16, lineHeight: 1.6 }}>Sin resultados para<br /><strong style={{ color: th.text, fontFamily: 'monospace' }}>"{query}"</strong></div>
          </div>
        )}

        {Object.entries(groups).map(([style, vestidos]) => (
          <StyleCard key={style} vestidos={vestidos} config={config} />
        ))}
      </div>
    </div>
  )
}
