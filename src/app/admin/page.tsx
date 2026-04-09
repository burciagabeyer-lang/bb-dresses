'use client'
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'

// ── Paleta Old Money ──────────────────────────────────────────
const cream  = '#FAF8F5'
const white  = '#FFFFFF'
const text   = '#1A1A1A'
const gold   = '#B8960C'
const grayL  = '#E8E4DE'
const grayM  = '#9C9690'
const olive  = '#4A6741'
const terra  = '#8B4040'
const serif  = "'Playfair Display', Georgia, 'Times New Roman', serif"


// ── Helpers ───────────────────────────────────────────────────
function fmtUSD(v: number) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v) }
function fmtMXN(v: number) { return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v) }
function calcCostoMXN(usd: number, cfg: any): number | null {
  if (!cfg) return null
  return usd * parseFloat(cfg.tipo_cambio_usd_mxn || '0')
}
function calcPrecioVenta(usd: number, cfg: any): number | null {
  if (!cfg) return null
  const costo = calcCostoMXN(usd, cfg)!
  return Math.ceil(costo * (1 + parseFloat(cfg.markup_porcentaje || '0') / 100) + parseFloat(cfg.cargo_adicional_mxn || '0'))
}
function calcUtilidad(usd: number, cfg: any): number | null {
  if (!cfg) return null
  return calcPrecioVenta(usd, cfg)! - calcCostoMXN(usd, cfg)!
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(26,26,26,0.5)', zIndex:200,
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      padding:'24px 16px', overflowY:'auto',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:cream, border:`1px solid ${grayL}`, borderRadius:2,
        width:'100%', maxWidth:580, marginTop:12,
        boxShadow:'0 8px 32px rgba(0,0,0,.16)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderBottom:`1px solid ${grayL}` }}>
          <span style={{ fontFamily:serif, fontSize:18, fontWeight:700, color:text }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:grayM, lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
        <div style={{ padding:'20px 24px', maxHeight:'80vh', overflowY:'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ── KPI chip ──────────────────────────────────────────────────
function KPI({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:1, padding:'0 14px', borderLeft:`1px solid ${grayL}`, flexShrink:0 }}>
      <div style={{ fontSize:10, color:'#9A8A7A', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:600, color:valueColor||text, fontFamily:'Georgia,serif', whiteSpace:'nowrap' }}>{value}</div>
    </div>
  )
}

// ── Fila de inventario (con estado local para precio_usd) ─────
function VestidoRow({ vestido, config, idx, onUpdate, onVender, onDevolver, expanded, onToggleExpand }: {
  vestido: any; config: any; idx: number;
  onUpdate: (id: string, campo: string, valor: string) => void;
  onVender: (v: any) => void;
  onDevolver: (v: any) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [precio, setPrecio] = useState(String(vestido.precio_usd ?? ''))
  const [tc,  setTc]  = useState(String(vestido.tipo_cambio_custom ?? config?.tipo_cambio_usd_mxn ?? ''))
  const [mk,  setMk]  = useState(String(vestido.markup_custom      ?? config?.markup_porcentaje   ?? ''))
  const [cgo, setCgo] = useState(String(vestido.cargo_custom       ?? config?.cargo_adicional_mxn ?? ''))

  const usdN   = parseFloat(precio) || 0
  const tcN    = parseFloat(tc)     || 0
  const mkN    = parseFloat(mk)     || 0
  const cgoN   = parseFloat(cgo)    || 0
  const costoMXN    = usdN * tcN
  const precioVenta = Math.ceil(costoMXN * (1 + mkN / 100) + cgoN)
  const utilidad    = precioVenta - costoMXN

  function blur(campo: string, val: string) {
    if (String(vestido[campo] ?? '') !== val) onUpdate(vestido.id, campo, val)
  }

  const rowBg = vestido.vendido ? '#F0EDE8' : (idx % 2 === 0 ? white : cream)
  const ci: React.CSSProperties = {
    background:'transparent', border:'none', outline:'none',
    color:text, fontSize:13, fontFamily:'system-ui', width:'100%', padding:'1px 0',
  }
  const td: React.CSSProperties = {
    padding:'0 10px', borderBottom:`1px solid ${grayL}`, height:40, whiteSpace:'nowrap', verticalAlign:'middle',
  }

  return (
    <Fragment>
      <tr onClick={onToggleExpand} style={{ background:rowBg, cursor:'pointer', opacity:vestido.vendido?.75:1 }}>
        {/* Style # — columna fija */}
        <td style={{ ...td, position:'sticky', left:0, background:rowBg, zIndex:1, minWidth:110, borderRight:`1px solid ${grayL}` }}>
          <input defaultValue={vestido.style_number} onBlur={e=>blur('style_number',e.target.value)}
            onClick={e=>e.stopPropagation()}
            style={{ ...ci, fontFamily:'monospace', fontWeight:700, color:gold }} />
        </td>
        <td style={{ ...td, color:grayM, fontSize:12, minWidth:110 }}>{vestido.tienda}</td>
        <td style={{ ...td, minWidth:100 }}>
          <input defaultValue={vestido.color} onBlur={e=>blur('color',e.target.value)}
            onClick={e=>e.stopPropagation()} style={ci} />
        </td>
        <td style={{ ...td, minWidth:60, textAlign:'center' }}>
          <input defaultValue={vestido.talla} onBlur={e=>blur('talla',e.target.value)}
            onClick={e=>e.stopPropagation()}
            style={{ ...ci, textAlign:'center', fontFamily:'monospace', width:44 }} />
        </td>
        <td style={{ ...td, minWidth:70, textAlign:'center' }}>
          <span style={{ fontFamily:'monospace', fontWeight:600 }}>{vestido.cantidad}</span>
          {(vestido.cantidad_vendida || 0) > 0 && (
            <span style={{ fontSize:10, color:terra, marginLeft:4 }}>{vestido.cantidad_vendida}v</span>
          )}
        </td>
        <td style={{ ...td, minWidth:100 }}>
          <input type="number" step="0.01" value={precio}
            onChange={e=>setPrecio(e.target.value)}
            onBlur={e=>blur('precio_usd',e.target.value)}
            onClick={e=>e.stopPropagation()} style={ci} />
        </td>
        {/* T/C editable */}
        <td style={{ ...td, minWidth:72 }} onClick={e=>e.stopPropagation()}>
          <input type="number" step="0.01" value={tc}
            onChange={e=>setTc(e.target.value)}
            onBlur={e=>blur('tipo_cambio_custom',e.target.value)}
            onClick={e=>e.stopPropagation()}
            style={{ ...ci, width:62, textAlign:'right', color:grayM, fontSize:12 }} />
        </td>
        {/* Mark% editable */}
        <td style={{ ...td, minWidth:65 }} onClick={e=>e.stopPropagation()}>
          <input type="number" step="1" value={mk}
            onChange={e=>setMk(e.target.value)}
            onBlur={e=>blur('markup_custom',e.target.value)}
            onClick={e=>e.stopPropagation()}
            style={{ ...ci, width:50, textAlign:'right', color:grayM, fontSize:12 }} />
        </td>
        {/* Cargo editable */}
        <td style={{ ...td, minWidth:80 }} onClick={e=>e.stopPropagation()}>
          <input type="number" step="1" value={cgo}
            onChange={e=>setCgo(e.target.value)}
            onBlur={e=>blur('cargo_custom',e.target.value)}
            onClick={e=>e.stopPropagation()}
            style={{ ...ci, width:68, textAlign:'right', color:grayM, fontSize:12 }} />
        </td>
        {/* Costo MXN */}
        <td style={{ ...td, minWidth:110 }}>
          {tcN ? fmtMXN(costoMXN) : '—'}
        </td>
        {/* Precio Venta */}
        <td style={{ ...td, minWidth:110, fontWeight:700 }}>
          {tcN ? fmtMXN(precioVenta) : '—'}
        </td>
        {/* Utilidad */}
        <td style={{ ...td, minWidth:100, fontWeight:700, color:'#6B7B4A' }}>
          {tcN ? fmtMXN(utilidad) : '—'}
        </td>
        <td style={{ ...td, minWidth:100 }}>
          <span style={{
            background: vestido.vendido ? `${terra}18` : `${olive}18`,
            color: vestido.vendido ? terra : olive,
            border: `1px solid ${vestido.vendido ? terra : olive}55`,
            borderRadius:2, padding:'2px 8px', fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase',
          }}>{vestido.vendido ? 'Vendido' : 'Disponible'}</span>
        </td>
        <td style={{ ...td, minWidth:130 }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:'flex', gap:4 }}>
            {vestido.cantidad > 0 && (
              <button onClick={e=>{e.stopPropagation();onVender(vestido)}} style={{
                background:gold, border:'none', borderRadius:2, padding:'3px 10px',
                fontSize:11, color:white, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
              }}>✓ Vender</button>
            )}
            {(vestido.cantidad_vendida||0) > 0 && (
              <button onClick={e=>{e.stopPropagation();onDevolver(vestido)}} style={{
                background:'transparent', border:`1px solid ${grayM}`, borderRadius:2,
                padding:'3px 9px', fontSize:11, color:grayM,
                cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
              }}>↩ Devolver</button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background:`${gold}07` }}>
          <td colSpan={14} style={{ padding:'12px 16px', borderBottom:`1px solid ${grayL}` }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[{ label:'Descripción', campo:'descripcion' },{ label:'Notas', campo:'notas' }].map(({ label, campo }) => (
                <div key={campo}>
                  <div style={{ fontSize:10, color:grayM, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                  <input defaultValue={vestido[campo]||''} onBlur={e=>blur(campo,e.target.value)}
                    placeholder={`Agregar ${label.toLowerCase()}...`}
                    style={{ width:'100%', background:white, border:`1px solid ${grayL}`, borderRadius:2, padding:'7px 10px', fontSize:13, fontFamily:'system-ui', color:text, outline:'none' }} />
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  )
}

// ── Card móvil ────────────────────────────────────────────────
function VestidoCard({ vestido, config, onUpdate, onVender, onDevolver, expanded, onToggleExpand }: {
  vestido: any; config: any;
  onUpdate: (id: string, campo: string, valor: string) => void;
  onVender: (v: any) => void;
  onDevolver: (v: any) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [precio, setPrecio] = useState(String(vestido.precio_usd ?? ''))
  const [tc,  setTc]  = useState(String(vestido.tipo_cambio_custom ?? config?.tipo_cambio_usd_mxn ?? ''))
  const [mk,  setMk]  = useState(String(vestido.markup_custom      ?? config?.markup_porcentaje   ?? ''))
  const [cgo, setCgo] = useState(String(vestido.cargo_custom       ?? config?.cargo_adicional_mxn ?? ''))

  const usdN        = parseFloat(precio) || 0
  const tcN         = parseFloat(tc)     || 0
  const mkN         = parseFloat(mk)     || 0
  const cgoN        = parseFloat(cgo)    || 0
  const costoMXN    = usdN * tcN
  const precioVenta = Math.ceil(costoMXN * (1 + mkN / 100) + cgoN)
  const utilidad    = precioVenta - costoMXN

  function blur(campo: string, val: string) {
    if (String(vestido[campo] ?? '') !== val) onUpdate(vestido.id, campo, val)
  }

  const ei: React.CSSProperties = {
    width:'100%', background:white, border:`1px solid ${grayL}`, borderRadius:6,
    padding:'8px 10px', fontSize:14, color:text, fontFamily:'system-ui', outline:'none',
  }
  const lbl: React.CSSProperties = {
    display:'block', fontSize:10, color:grayM, fontWeight:700,
    letterSpacing:'.07em', textTransform:'uppercase', marginBottom:4,
  }

  return (
    <div style={{
      background:white, border:`1px solid ${grayL}`, borderRadius:8,
      padding:14, marginBottom:8, opacity: vestido.vendido ? 0.82 : 1,
    }}>
      {/* Style # + pill */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color:gold }}>{vestido.style_number}</span>
        <span style={{
          background: vestido.vendido ? `${terra}18` : `${olive}18`,
          color: vestido.vendido ? terra : olive,
          border: `1px solid ${vestido.vendido ? terra : olive}55`,
          borderRadius:10, padding:'2px 10px', fontSize:10, fontWeight:700,
          letterSpacing:'.05em', textTransform:'uppercase',
        }}>{vestido.vendido ? 'Agotado' : 'Disponible'}</span>
      </div>

      {/* Color · Talla · Tienda · Cant. */}
      <div style={{ fontSize:12, color:grayM, marginBottom:10 }}>
        {[vestido.color, vestido.talla, vestido.tienda].filter(Boolean).join(' · ')}
        <span style={{ marginLeft:8, fontFamily:'monospace', fontWeight:600, color:text }}>{vestido.cantidad}</span>
        {(vestido.cantidad_vendida||0) > 0 && (
          <span style={{ fontSize:11, color:terra, marginLeft:4 }}>/ {vestido.cantidad_vendida}v</span>
        )}
      </div>

      <div style={{ height:1, background:grayL, marginBottom:10 }} />

      {/* Costo + Utilidad */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:13, color:grayM }}>Costo <strong style={{ color:text }}>{tcN ? fmtMXN(costoMXN) : '—'}</strong></span>
        <span style={{ fontSize:13, fontWeight:700, color:'#6B7B4A' }}>Utilidad {tcN ? fmtMXN(utilidad) : '—'}</span>
      </div>

      {/* Precio venta */}
      <div style={{ fontSize:20, fontWeight:700, color:text, marginBottom:12 }}>
        {tcN ? fmtMXN(precioVenta) : <span style={{ color:grayM, fontSize:13 }}>Sin T/C configurado</span>}
      </div>

      <div style={{ height:1, background:grayL, marginBottom:10 }} />

      {/* Botones vender / devolver */}
      <div style={{ display:'flex', gap:8 }}>
        {vestido.cantidad > 0 && (
          <button onClick={e=>{ e.stopPropagation(); onVender(vestido) }} style={{
            flex:1, padding:'11px', fontSize:13, fontWeight:700, borderRadius:6,
            cursor:'pointer', fontFamily:'inherit', border:'none', background:gold, color:white,
          }}>✓ Vender</button>
        )}
        {(vestido.cantidad_vendida||0) > 0 && (
          <button onClick={e=>{ e.stopPropagation(); onDevolver(vestido) }} style={{
            flex:1, padding:'11px', fontSize:13, fontWeight:700, borderRadius:6,
            cursor:'pointer', fontFamily:'inherit',
            border:`1px solid ${grayM}`, background:'transparent', color:grayM,
          }}>↩ Devolver</button>
        )}
      </div>

      {/* Toggle expansión */}
      <button onClick={onToggleExpand} style={{
        width:'100%', background:'none', border:'none', color:grayM,
        fontSize:12, cursor:'pointer', padding:'8px 0 0', fontFamily:'inherit',
      }}>{expanded ? '▲ Ocultar' : '▼ Editar campos'}</button>

      {/* Campos editables expandidos */}
      {expanded && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10, paddingTop:12, borderTop:`1px solid ${grayL}` }}>
          <div>
            <label style={lbl}>Precio USD</label>
            <input type="number" step="0.01" value={precio}
              onChange={e=>setPrecio(e.target.value)}
              onBlur={e=>blur('precio_usd',e.target.value)} style={ei} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div>
              <label style={lbl}>T/C</label>
              <input type="number" step="0.01" value={tc}
                onChange={e=>setTc(e.target.value)}
                onBlur={e=>blur('tipo_cambio_custom',e.target.value)} style={ei} />
            </div>
            <div>
              <label style={lbl}>Mark%</label>
              <input type="number" step="1" value={mk}
                onChange={e=>setMk(e.target.value)}
                onBlur={e=>blur('markup_custom',e.target.value)} style={ei} />
            </div>
            <div>
              <label style={lbl}>Cargo</label>
              <input type="number" step="1" value={cgo}
                onChange={e=>setCgo(e.target.value)}
                onBlur={e=>blur('cargo_custom',e.target.value)} style={ei} />
            </div>
          </div>
          {[{ label:'Descripción', campo:'descripcion' },{ label:'Notas', campo:'notas' }].map(({ label, campo })=>(
            <div key={campo}>
              <label style={lbl}>{label}</label>
              <input defaultValue={vestido[campo]||''}
                placeholder={`Agregar ${label.toLowerCase()}...`}
                onBlur={e=>blur(campo,e.target.value)} style={ei} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function AdminPage() {
  const [vestidos, setVestidos]     = useState<any[]>([])
  const [config, setConfig]         = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [display, setDisplay]       = useState('')
  const [filtro, setFiltro]         = useState('')
  const [tiendaF, setTiendaF]       = useState('')
  const [estado, setEstado]         = useState<'todos'|'disponibles'|'vendidos'>('todos')
  const [modalSubir, setModalSubir] = useState(false)
  const [modalCfg, setModalCfg]     = useState(false)
  const [expanded, setExpanded]     = useState<string|null>(null)
  const [isMobile, setIsMobile]     = useState(false)
  const debRef = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function load() {
    setLoading(true)
    Promise.all([
      fetch('/api/vestidos?all=true').then(r=>r.json()),
      fetch('/api/config').then(r=>r.json()),
    ]).then(([vd,cd]) => {
      setVestidos(vd.data||[])
      setConfig(cd.data||null)
      setLoading(false)
    })
  }
  useEffect(load, [])

  function handleFiltro(val: string) {
    setDisplay(val)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => setFiltro(val), 300)
  }

  async function vender(v: any) {
    const res  = await fetch('/api/vestidos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:v.id, accion:'vender' }) })
    const data = await res.json()
    if (data.success) {
      setVestidos(p => p.map(x => x.id===v.id ? { ...x, cantidad:data.cantidad, cantidad_vendida:data.cantidad_vendida, vendido:data.vendido } : x))
    }
  }

  async function devolver(v: any) {
    const res  = await fetch('/api/vestidos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:v.id, accion:'devolver' }) })
    const data = await res.json()
    if (data.success) {
      setVestidos(p => p.map(x => x.id===v.id ? { ...x, cantidad:data.cantidad, cantidad_vendida:data.cantidad_vendida, vendido:data.vendido } : x))
    }
  }

  async function updateCampo(id: string, campo: string, valor: string) {
    await fetch('/api/vestidos', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,[campo]:valor}) })
    setVestidos(p=>p.map(x=>x.id===id?{...x,[campo]:valor}:x))
  }

  // Filtrado
  const q = filtro.toLowerCase()
  const filtrados = vestidos.filter(v => {
    const mQ = !q || v.style_number?.toLowerCase().includes(q) || v.color?.toLowerCase().includes(q) || v.descripcion?.toLowerCase().includes(q) || v.tienda?.toLowerCase().includes(q)
    const mT = !tiendaF || v.tienda === tiendaF
    const mE = estado==='todos' || (estado==='disponibles' ? !v.vendido : v.vendido)
    return mQ && mT && mE
  })

  // Tiendas dinámicas
  const tiendas = Array.from(new Set(vestidos.map(v=>v.tienda).filter(Boolean))).sort()

  // KPIs
  const disp       = vestidos.filter(v=>v.cantidad > 0)
  const piezas     = vestidos.reduce((s,v)=>s+(parseInt(v.cantidad)||0),0)
  const vendidas   = vestidos.reduce((s,v)=>s+(parseInt(v.cantidad_vendida)||0),0)
  const invertido  = vestidos.reduce((s,v)=>s+(parseFloat(v.precio_usd)||0)*(parseInt(v.cantidad)||0),0)
  function rowFinancials(v: any) {
    const usd  = parseFloat(v.precio_usd) || 0
    const tc   = parseFloat(v.tipo_cambio_custom ?? config?.tipo_cambio_usd_mxn  ?? 0)
    const mk   = parseFloat(v.markup_custom      ?? config?.markup_porcentaje    ?? 0)
    const crg  = parseFloat(v.cargo_custom       ?? config?.cargo_adicional_mxn  ?? 0)
    const costo = usd * tc
    const venta = Math.ceil(costo * (1 + mk / 100) + crg)
    return { costo, venta, util: venta - costo }
  }
  const valorVenta = disp.reduce((s,v)=>{
    const { venta } = rowFinancials(v)
    return s + venta * (parseInt(v.cantidad)||1)
  },0)
  const utilidadTotal = disp.reduce((s,v)=>{
    const { util } = rowFinancials(v)
    return s + util * (parseInt(v.cantidad)||1)
  },0)

  const HEADER_H = 56

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:cream, fontFamily:'system-ui,-apple-system,sans-serif', color:text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700&display=swap');
        *{box-sizing:border-box}
        html,body{height:100%;overflow:hidden}
        input:focus{outline:1px solid ${gold};border-radius:1px;outline-offset:1px}
        input[type=number]::-webkit-inner-spin-button{opacity:0}
        ::-webkit-scrollbar{height:4px;width:4px}
        ::-webkit-scrollbar-track{background:${grayL}}
        ::-webkit-scrollbar-thumb{background:${gold};border-radius:2px}
        tr:hover td{background:${gold}06!important}
      `}</style>

      {/* Header — nunca se mueve */}
      <header style={{
        flexShrink:0, position:'sticky', top:0, zIndex:100,
        background:cream, borderBottom:`1px solid ${grayL}`,
        height:HEADER_H, display:'flex', alignItems:'center',
        padding:'0 20px', gap:12,
      }}>
        {/* Logo */}
        <a href="/" style={{ textDecoration:'none', display:'flex', alignItems:'baseline', gap:8, marginRight:8, flexShrink:0 }}>
          <span style={{ fontFamily:serif, fontSize:22, fontWeight:700, color:gold }}>BB</span>
          <span style={{ letterSpacing:'0.2em', fontSize:10, fontWeight:700, textTransform:'uppercase', color:text }}>DRESSES</span>
        </a>

        {/* KPIs — solo en desktop */}
        {!isMobile && (
          <div style={{ display:'flex', gap:0, overflowX:'auto', flex:1, scrollbarWidth:'none' }}>
            <KPI label="Disponibles" value={`${piezas} piezas`} />
            <KPI label="Invertido" value={fmtUSD(invertido)} />
            {config && <KPI label="Valor venta" value={fmtMXN(valorVenta)} />}
            {config && <KPI label="Utilidad" value={fmtMXN(utilidadTotal)} valueColor="#6B7B4A" />}
            <KPI label="Vendidas" value={`${vendidas} piezas`} />
          </div>
        )}
        {isMobile && <div style={{ flex:1 }} />}

        {/* Acciones */}
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={()=>setModalSubir(true)} title="Subir factura" style={{
            background:gold, border:'none', borderRadius:2,
            width:34, height:34, fontSize:22, cursor:'pointer', color:white,
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:300, lineHeight:1,
          }}>+</button>
          <button onClick={()=>setModalCfg(true)} title="Configuración" style={{
            background:'none', border:`1px solid ${grayL}`, borderRadius:2,
            width:34, height:34, fontSize:15, cursor:'pointer', color:grayM,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>⚙</button>
        </div>
      </header>

      {/* KPI strip — solo en mobile, debajo del header */}
      {isMobile && (
        <div style={{
          flexShrink:0, background:cream, borderBottom:`1px solid ${grayL}`,
          display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none',
          padding:'0 4px',
        }}>
          <KPI label="Disponibles" value={`${piezas}p`} />
          <KPI label="Vendidas" value={`${vendidas}p`} />
          <KPI label="Invertido" value={fmtUSD(invertido)} />
          {config && <KPI label="Venta" value={fmtMXN(valorVenta)} />}
          {config && <KPI label="Utilidad" value={fmtMXN(utilidadTotal)} valueColor="#6B7B4A" />}
        </div>
      )}

      {/* Barra de filtros — nunca se mueve */}
      <div style={{
        flexShrink:0, position:'sticky', top:`${HEADER_H}px`, zIndex:99,
        background:cream, borderBottom:`1px solid ${grayL}`,
        padding:'10px 16px', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center',
      }}>
        <div style={{ position:'relative', flex: isMobile ? '1 1 100%' : '1 1 180px' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:grayM, pointerEvents:'none' }}>⌕</span>
          <input value={display} onChange={e=>handleFiltro(e.target.value)} placeholder="Buscar style#, color, tienda..."
            style={{ width:'100%', background:white, border:`1px solid ${grayL}`, borderRadius:2, padding:'8px 10px 8px 28px', fontSize:13, color:text, fontFamily:'inherit', outline:'none' }} />
        </div>

        {!isMobile && (
          <select value={tiendaF} onChange={e=>setTiendaF(e.target.value)}
            style={{ background:white, border:`1px solid ${grayL}`, borderRadius:2, padding:'8px 10px', fontSize:13, color:text, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
            <option value="">Todas las tiendas</option>
            {tiendas.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        )}

        <div style={{ display:'flex', gap:4 }}>
          {(['todos','disponibles','vendidos'] as const).map(e=>(
            <button key={e} onClick={()=>setEstado(e)} style={{
              background: estado===e ? gold : white,
              border: `1px solid ${estado===e ? gold : grayL}`,
              borderRadius:20, padding:'5px 13px', fontSize:11,
              fontWeight: estado===e ? 700 : 400,
              color: estado===e ? white : grayM,
              cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize',
              transition:'all .15s',
            }}>{e}</button>
          ))}
        </div>

        <div style={{ fontSize:11, color:grayM, marginLeft:'auto', flexShrink:0 }}>{filtrados.length} registros</div>
      </div>

      {/* Contenido — única zona con scroll */}
      <div style={{ flex:1, overflowY:'auto', overflowX: isMobile ? 'hidden' : 'auto' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'72px 0', color:grayM }}>
            <div style={{ fontFamily:serif, fontSize:18, marginBottom:6 }}>Cargando inventario</div>
            <div style={{ fontSize:12, letterSpacing:'.08em' }}>Por favor espera...</div>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'72px 0', color:grayM }}>
            <div style={{ fontFamily:serif, fontSize:20, marginBottom:8, color:text }}>Sin resultados</div>
            <div style={{ fontSize:13 }}>Ajusta los filtros de búsqueda</div>
          </div>
        ) : isMobile ? (
          /* ── Vista cards (mobile) ── */
          <div style={{ padding:'12px 16px' }}>
            {filtrados.map(v => (
              <VestidoCard key={v.id}
                vestido={v} config={config}
                onUpdate={updateCampo}
                onVender={vender}
                onDevolver={devolver}
                expanded={expanded === v.id}
                onToggleExpand={() => setExpanded(p => p===v.id ? null : v.id)}
              />
            ))}
          </div>
        ) : (
          /* ── Vista tabla (desktop) ── */
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:1180 }}>
            <thead style={{ position:'sticky', top:0, zIndex:50, background:cream }}>
              <tr>
                {['Style #','Tienda','Color','Talla','Cant.','Precio USD','T/C','Mark%','Cargo','Costo MXN','Precio Venta','Utilidad','Estado','Acción'].map((h,i)=>(
                  <th key={i} style={{
                    padding:'9px 10px', textAlign:'left', fontSize:9, fontWeight:700,
                    letterSpacing:'.1em', textTransform:'uppercase', color:grayM,
                    borderBottom:`2px solid ${gold}`,
                    whiteSpace:'nowrap', userSelect:'none',
                    ...(i===0 ? {position:'sticky',left:0,background:cream,zIndex:51,borderRight:`1px solid ${grayL}`} : {}),
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((v, idx) => (
                <VestidoRow key={v.id}
                  vestido={v} config={config} idx={idx}
                  onUpdate={updateCampo}
                  onVender={vender}
                  onDevolver={devolver}
                  expanded={expanded === v.id}
                  onToggleExpand={() => setExpanded(p => p===v.id ? null : v.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Subir factura */}
      {modalSubir && (
        <Modal title="Subir Factura" onClose={()=>setModalSubir(false)}>
          <SubirFacturaContent onDone={()=>{ setModalSubir(false); load() }} />
        </Modal>
      )}

      {/* Modal: Aplicar a todos */}
      {modalCfg && (
        <Modal title="Aplicar a todos" onClose={()=>setModalCfg(false)}>
          <AplicarGlobalContent config={config} onDone={()=>{ setModalCfg(false); load() }} />
        </Modal>
      )}
    </div>
  )
}

// ── Modal: Subir Factura ──────────────────────────────────────
function SubirFacturaContent({ onDone }: { onDone: () => void }) {
  const [stage, setStage]       = useState<'upload'|'extracting'|'review'|'saving'|'done'>('upload')
  const [preview, setPreview]   = useState<string|null>(null)
  const [base64, setBase64]     = useState<string|null>(null)
  const [mime, setMime]         = useState('image/jpeg')
  const [info, setInfo]         = useState({ tienda:'', numero_factura:'', fecha:'' })
  const [vestidos, setVestidos] = useState<any[]>([])
  const [error, setError]       = useState<string|null>(null)
  const [saved, setSaved]       = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function loadFile(file: File) {
    setMime(file.type||'image/jpeg')
    const r = new FileReader()
    r.onload = e => { const res = e.target?.result as string; setPreview(res); setBase64(res.split(',')[1]) }
    r.readAsDataURL(file)
  }

  async function extract() {
    if (!base64) return
    setStage('extracting'); setError(null)
    try {
      const res = await fetch('/api/extract', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({imageBase64:base64,imageMime:mime}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInfo({ tienda:data.data.tienda||'', numero_factura:data.data.numero_factura||'', fecha:data.data.fecha||'' })
      setVestidos((data.data.vestidos||[]).map((v:any,i:number)=>({...v,_id:`v_${Date.now()}_${i}`})))
      setStage('review')
    } catch(e:any) { setError(e.message); setStage('upload') }
  }

  async function save() {
    setStage('saving')
    try {
      const res = await fetch('/api/vestidos', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ factura:info, vestidos:vestidos.map(({_id,...v})=>v) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(data); setStage('done')
    } catch(e:any) { setError(e.message); setStage('review') }
  }

  const inp: React.CSSProperties = { background:white, border:`1px solid ${grayL}`, borderRadius:2, color:text, padding:'8px 10px', fontSize:13, width:'100%', fontFamily:'system-ui', outline:'none' }
  const totalPiezas = vestidos.reduce((s,v)=>s+(parseInt(v.cantidad)||0),0)
  const totalUSD    = vestidos.reduce((s,v)=>s+((parseFloat(v.precio_usd)||0)*(parseInt(v.cantidad)||1)),0)

  if (stage==='done') return (
    <div style={{ textAlign:'center', padding:'28px 0' }}>
      <div style={{ fontFamily:serif, fontSize:22, marginBottom:8, color:text }}>Factura guardada</div>
      <p style={{ color:grayM, marginBottom:24 }}>
        <strong style={{color:gold}}>{saved?.vestidos_guardados}</strong> vestidos de <strong style={{color:gold}}>{info.tienda}</strong> guardados correctamente.
      </p>
      <button onClick={onDone} style={{ background:gold, border:'none', borderRadius:2, color:white, padding:'12px 32px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>Cerrar</button>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {error && <div style={{ background:`${terra}10`, border:`1px solid ${terra}44`, borderRadius:2, padding:'10px 14px', color:terra, fontSize:13 }}>⚠ {error}</div>}

      {stage==='upload' && !preview && (
        <div onClick={()=>fileRef.current?.click()}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.type.startsWith('image/'))loadFile(f)}}
          style={{ border:`1.5px dashed ${grayL}`, borderRadius:2, padding:'36px 24px', textAlign:'center', cursor:'pointer' }}>
          <div style={{ fontFamily:serif, fontSize:16, marginBottom:6, color:text }}>Sube la foto de la factura</div>
          <div style={{ fontSize:12, color:grayM }}>Toca aquí o arrastra · JPG, PNG, WEBP, HEIC</div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])loadFile(e.target.files[0]);e.target.value=''}} />
        </div>
      )}

      {stage==='upload' && preview && (
        <>
          <div style={{ position:'relative', borderRadius:2, overflow:'hidden', border:`1px solid ${grayL}` }}>
            <img src={preview} alt="" style={{ width:'100%', maxHeight:300, objectFit:'contain', display:'block', background:grayL }} />
            <button onClick={()=>{setPreview(null);setBase64(null)}} style={{ position:'absolute',top:8,right:8,background:'rgba(26,26,26,0.7)',border:'none',borderRadius:'50%',width:28,height:28,color:white,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
          <button onClick={extract} style={{ background:gold,border:'none',borderRadius:2,color:white,padding:'13px',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit' }}>Analizar con IA</button>
        </>
      )}

      {stage==='extracting' && (
        <div style={{ textAlign:'center', padding:'32px 0', color:grayM }}>
          <div style={{ fontFamily:serif, fontSize:16, marginBottom:6 }}>Analizando factura...</div>
          <div style={{ fontSize:12 }}>Claude está extrayendo los datos</div>
        </div>
      )}

      {(stage==='review'||stage==='saving') && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[['Tienda','tienda','text'],['# Factura','numero_factura','text'],['Fecha','fecha','date']].map(([label,key,type])=>(
              <div key={key}>
                <div style={{ fontSize:10,color:grayM,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:4 }}>{label}</div>
                <input type={type} value={(info as any)[key]} onChange={e=>setInfo(p=>({...p,[key]:e.target.value}))}
                  placeholder={key==='tienda' ? 'Ej. Jovani, Faviana...' : undefined}
                  style={inp} />
              </div>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:serif, fontSize:15, color:text }}>Vestidos <span style={{ fontSize:12,color:grayM }}>({vestidos.length})</span></span>
            <button onClick={()=>setVestidos(p=>[...p,{_id:`v_${Date.now()}`,style_number:'',color:'',talla:'',cantidad:1,precio_usd:'',descripcion:''}])}
              style={{ background:'none',border:`1px solid ${gold}`,borderRadius:2,color:gold,padding:'5px 12px',cursor:'pointer',fontSize:12,fontFamily:'inherit' }}>+ Agregar</button>
          </div>

          <div style={{ overflowX:'auto', border:`1px solid ${grayL}`, borderRadius:2 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:grayL }}>
                  {['Style #','Color','Talla','Cant.','Precio USD','Descripción',''].map((h,i)=>(
                    <th key={i} style={{ padding:'7px 8px',textAlign:'left',color:grayM,fontSize:9,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',borderBottom:`1px solid ${grayL}`,whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vestidos.map((v,i)=>(
                  <tr key={v._id}>
                    {[
                      <input className="fi" style={{fontFamily:'monospace',fontWeight:700,color:gold}} value={v.style_number} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],style_number:e.target.value};return n})} />,
                      <input className="fi" value={v.color} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],color:e.target.value};return n})} />,
                      <input className="fi" value={v.talla} style={{textAlign:'center'}} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],talla:e.target.value};return n})} />,
                      <input className="fi" type="number" value={v.cantidad} style={{textAlign:'center',width:40}} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],cantidad:e.target.value};return n})} />,
                      <input className="fi" type="number" step="0.01" value={v.precio_usd} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],precio_usd:e.target.value};return n})} />,
                      <input className="fi" value={v.descripcion||''} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],descripcion:e.target.value};return n})} />,
                      <button onClick={()=>setVestidos(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:terra,cursor:'pointer',fontSize:15,padding:'0 4px'}}>✕</button>
                    ].map((cell,ci)=><td key={ci} style={{padding:'3px 6px',borderBottom:`1px solid ${grayL}`,verticalAlign:'middle'}}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <style>{`.fi{background:${grayL};border:1px solid ${grayL};border-radius:1px;color:${text};padding:4px 6px;font-size:12px;width:100%;font-family:system-ui;outline:none}`}</style>
          </div>

          <div style={{ display:'flex', gap:20, padding:'10px 14px', background:grayL, borderRadius:2, fontSize:12 }}>
            <span>Total piezas <strong>{totalPiezas}</strong></span>
            <span>Total USD <strong style={{color:gold}}>{fmtUSD(totalUSD)}</strong></span>
          </div>

          {!info.tienda && <p style={{ color:terra, fontSize:12, margin:0 }}>⚠ Ingresa la tienda antes de guardar.</p>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setStage('upload');setVestidos([]);setPreview(null);setBase64(null)}}
              style={{ flex:1,background:'none',border:`1px solid ${grayL}`,borderRadius:2,color:grayM,padding:'11px',cursor:'pointer',fontFamily:'inherit',fontSize:13 }}>Cancelar</button>
            <button onClick={save} disabled={!info.tienda||vestidos.length===0||stage==='saving'}
              style={{ flex:2,background:gold,border:'none',borderRadius:2,color:white,padding:'11px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:stage==='saving'?.6:1 }}>
              {stage==='saving' ? 'Guardando...' : `Guardar ${vestidos.length} vestidos`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Modal: Configuración de precios ──────────────────────────
function ConfigContent({ initialConfig, onSaved }: { initialConfig: any; onSaved: (cfg: any) => void }) {
  const [cfg, setCfg] = useState({
    tipo_cambio_usd_mxn: String(initialConfig?.tipo_cambio_usd_mxn || '18.00'),
    markup_porcentaje:   String(initialConfig?.markup_porcentaje   || '100'),
    cargo_adicional_mxn: String(initialConfig?.cargo_adicional_mxn || '0'),
    notas:               initialConfig?.notas || '',
  })
  const [saving, setSaving] = useState(false)

  async function guardar() {
    setSaving(true)
    await fetch('/api/config', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(cfg) })
    setSaving(false)
    onSaved({
      ...initialConfig,
      tipo_cambio_usd_mxn: parseFloat(cfg.tipo_cambio_usd_mxn),
      markup_porcentaje:   parseFloat(cfg.markup_porcentaje),
      cargo_adicional_mxn: parseFloat(cfg.cargo_adicional_mxn),
      notas: cfg.notas,
    })
  }

  const ejemplo  = 319
  const enMXN    = ejemplo * parseFloat(cfg.tipo_cambio_usd_mxn||'0')
  const conMark  = enMXN * (1 + parseFloat(cfg.markup_porcentaje||'0') / 100)
  const final    = Math.ceil(conMark + parseFloat(cfg.cargo_adicional_mxn||'0'))

  const inp: React.CSSProperties = { background:white, border:`1px solid ${grayL}`, borderRadius:2, color:text, padding:'10px 12px', fontSize:15, width:'100%', fontFamily:'system-ui', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:10, color:grayM, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:5 }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {[
        { key:'tipo_cambio_usd_mxn', label:'Tipo de cambio USD → MXN' },
        { key:'markup_porcentaje',   label:'Markup / Ganancia (%)' },
        { key:'cargo_adicional_mxn', label:'Cargo adicional (MXN)' },
      ].map(f=>(
        <div key={f.key}>
          <label style={lbl}>{f.label}</label>
          <input type="number" step="0.01" value={(cfg as any)[f.key]}
            onChange={e=>setCfg(p=>({...p,[f.key]:e.target.value}))} style={inp} />
        </div>
      ))}

      <div>
        <label style={lbl}>Notas</label>
        <textarea value={cfg.notas} onChange={e=>setCfg(p=>({...p,notas:e.target.value}))} rows={2}
          style={{ ...inp, resize:'vertical', fontSize:13 }} />
      </div>

      {/* Preview en tiempo real */}
      <div style={{ background:grayL, borderRadius:2, padding:'14px 16px' }}>
        <div style={{ fontSize:9, color:grayM, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>Preview — vestido a $319 USD</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5, fontSize:13 }}>
          <div style={{ display:'flex', justifyContent:'space-between', color:grayM }}><span>En MXN</span><span style={{color:text}}>{fmtMXN(enMXN)}</span></div>
          <div style={{ display:'flex', justifyContent:'space-between', color:grayM }}><span>+ Markup {cfg.markup_porcentaje}%</span><span style={{color:text}}>+{fmtMXN(enMXN*parseFloat(cfg.markup_porcentaje||'0')/100)}</span></div>
          {parseFloat(cfg.cargo_adicional_mxn||'0')>0 && (
            <div style={{ display:'flex', justifyContent:'space-between', color:grayM }}><span>+ Cargo adicional</span><span style={{color:text}}>+{fmtMXN(parseFloat(cfg.cargo_adicional_mxn))}</span></div>
          )}
          <div style={{ borderTop:`1px solid ${grayM}44`, marginTop:4, paddingTop:8, display:'flex', justifyContent:'space-between' }}>
            <strong>Precio de venta</strong>
            <strong style={{ fontFamily:serif, fontSize:18, color:gold }}>{fmtMXN(final)}</strong>
          </div>
        </div>
      </div>

      <button onClick={guardar} disabled={saving}
        style={{ background:gold,border:'none',borderRadius:2,color:white,padding:'13px',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',width:'100%',opacity:saving?.7:1 }}>
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </div>
  )
}

// ── Modal: Aplicar a todos ─────────────────────────────────────
function AplicarGlobalContent({ config, onDone }: { config: any; onDone: () => void }) {
  const [tc,    setTc]    = useState(String(config?.tipo_cambio_usd_mxn  || ''))
  const [mk,    setMk]    = useState(String(config?.markup_porcentaje    || ''))
  const [cargo, setCargo] = useState(String(config?.cargo_adicional_mxn  || ''))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string|null>(null)
  const [done,   setDone]   = useState(false)

  const inp: React.CSSProperties = { background:white, border:`1px solid ${grayL}`, borderRadius:2, color:text, padding:'10px 12px', fontSize:15, width:'100%', fontFamily:'system-ui', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:10, color:grayM, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:5 }

  async function aplicar() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/vestidos/aplicar-global', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ tipo_cambio:tc, markup:mk, cargo })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
    } catch(e:any) { setError(e.message) }
    setSaving(false)
  }

  if (done) return (
    <div style={{ textAlign:'center', padding:'28px 0' }}>
      <div style={{ fontFamily:serif, fontSize:22, marginBottom:8, color:text }}>Valores aplicados</div>
      <p style={{ color:grayM, marginBottom:24 }}>Todos los vestidos tienen ahora T/C <strong style={{color:gold}}>{tc}</strong>, Markup <strong style={{color:gold}}>{mk}%</strong>, Cargo <strong style={{color:gold}}>{fmtMXN(parseFloat(cargo)||0)}</strong>.</p>
      <button onClick={onDone} style={{ background:gold,border:'none',borderRadius:2,color:white,padding:'12px 32px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:14 }}>
        Cerrar y actualizar
      </button>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:`${terra}10`, border:`1px solid ${terra}44`, borderRadius:2, padding:'10px 14px', color:terra, fontSize:13 }}>
        ⚠ Esto sobreescribirá los valores individuales de <strong>todos</strong> los vestidos.
      </div>
      {error && <div style={{ color:terra, fontSize:12 }}>Error: {error}</div>}
      {([['T/C (USD → MXN)', tc, setTc], ['Markup / Ganancia (%)', mk, setMk], ['Cargo adicional (MXN)', cargo, setCargo]] as const).map(([label, val, set])=>(
        <div key={label}>
          <label style={lbl}>{label}</label>
          <input type="number" step="0.01" value={val} onChange={e=>(set as any)(e.target.value)} style={inp} />
        </div>
      ))}
      <button onClick={aplicar} disabled={saving}
        style={{ background:gold,border:'none',borderRadius:2,color:white,padding:'13px',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',opacity:saving?.6:1 }}>
        {saving ? 'Aplicando...' : 'Aplicar a todos los vestidos'}
      </button>
    </div>
  )
}
