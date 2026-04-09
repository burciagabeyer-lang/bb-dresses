'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const th = {
  bg: '#0D0D0D', surface: '#161616', surfaceAlt: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', text: '#F0EDE8',
  muted: '#888880', success: '#4CAF7D', error: '#E05A4A',
}

const TIENDAS = ["LaVeneto","Cinderella Divine","Faviana","Jovani","Morilee","Sherri Hill","Mac Duggal","Terani","Otra"]

type Tab = 'subir' | 'inventario' | 'precios'

function fmtUSD(v: number) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v) }
function fmtMXN(v: number) { return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v) }

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('subir')

  return (
    <div style={{ minHeight: '100vh', background: th.bg }}>
      {/* Header */}
      <div style={{ background: th.surface, borderBottom: `1px solid ${th.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/" style={{ color: th.muted, textDecoration: 'none', fontSize: 20 }}>←</a>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Panel Admin</div>
          <div style={{ fontSize: 11, color: th.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>BB Dresses</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: th.surface, borderBottom: `1px solid ${th.border}`, display: 'flex', padding: '0 20px' }}>
        {([['subir','📄 Subir Factura'],['inventario','📦 Inventario'],['precios','💰 Precios']] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', color: tab===t ? th.gold : th.muted,
            padding: '14px 18px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            fontWeight: tab===t ? 700 : 400,
            borderBottom: `2px solid ${tab===t ? th.gold : 'transparent'}`,
          }}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
        {tab === 'subir'      && <TabSubir />}
        {tab === 'inventario' && <TabInventario />}
        {tab === 'precios'    && <TabPrecios />}
      </div>
    </div>
  )
}

// ── TAB: Subir Factura ───────────────────────────────────────
function TabSubir() {
  const [stage, setStage]       = useState<'upload'|'extracting'|'review'|'saving'|'done'>('upload')
  const [preview, setPreview]   = useState<string|null>(null)
  const [base64, setBase64]     = useState<string|null>(null)
  const [mime, setMime]         = useState('image/jpeg')
  const [info, setInfo]         = useState({ tienda:'', numero_factura:'', fecha:'' })
  const [vestidos, setVestidos] = useState<any[]>([])
  const [error, setError]       = useState<string|null>(null)
  const [saved, setSaved]       = useState<any>(null)
  const [idCnt, setIdCnt]       = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function uid() { setIdCnt(c=>c+1); return `v_${Date.now()}_${idCnt}` }

  function loadFile(file: File) {
    setMime(file.type||'image/jpeg')
    const r = new FileReader()
    r.onload = e => {
      const result = e.target?.result as string
      setPreview(result)
      setBase64(result.split(',')[1])
    }
    r.readAsDataURL(file)
  }

  async function extract() {
    if (!base64) return
    setStage('extracting'); setError(null)
    try {
      const res  = await fetch('/api/extract', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({imageBase64:base64, imageMime:mime}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInfo({ tienda: data.data.tienda||'', numero_factura: data.data.numero_factura||'', fecha: data.data.fecha||'' })
      setVestidos((data.data.vestidos||[]).map((v:any,i:number)=>({...v,_id:`v_${Date.now()}_${i}`})))
      setStage('review')
    } catch(e:any) { setError(e.message); setStage('upload') }
  }

  async function save() {
    setStage('saving')
    try {
      const res  = await fetch('/api/vestidos', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ factura: info, vestidos: vestidos.map(({_id,...v})=>v) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(data); setStage('done')
    } catch(e:any) { setError(e.message); setStage('review') }
  }

  function reset() {
    setStage('upload'); setPreview(null); setBase64(null)
    setInfo({tienda:'',numero_factura:'',fecha:''}); setVestidos([]); setError(null); setSaved(null)
  }

  // Agrupación por estilo
  const styleGroups: Record<string,number[]> = {}
  vestidos.forEach((v,i)=>{ const k=v.style_number||`_e${i}`; if(!styleGroups[k])styleGroups[k]=[]; styleGroups[k].push(i) })
  const styleKeys = Object.keys(styleGroups)
  const styleColor: Record<string,string> = {}
  styleKeys.forEach((k,i)=>{ styleColor[k]=i%2===0?'rgba(201,168,76,0.04)':'transparent' })

  const totalPiezas = vestidos.reduce((s,v)=>s+(parseInt(v.cantidad)||0),0)
  const totalUSD    = vestidos.reduce((s,v)=>s+((parseFloat(v.precio_usd)||0)*(parseInt(v.cantidad)||1)),0)

  if (stage==='done') return (
    <div style={{textAlign:'center',padding:'48px 24px'}}>
      <div style={{fontSize:52,marginBottom:16}}>✅</div>
      <h2 style={{fontSize:22,marginBottom:8}}>¡Factura guardada!</h2>
      <p style={{color:th.muted}}><span style={{color:th.gold,fontWeight:700}}>{saved?.vestidos_guardados}</span> vestidos de <span style={{color:th.gold,fontWeight:700}}>{info.tienda}</span> guardados en Supabase.</p>
      <button onClick={reset} style={{marginTop:24,background:th.gold,border:'none',borderRadius:8,color:'#0D0D0D',padding:'12px 28px',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>Subir otra factura</button>
    </div>
  )

  return (
    <div>
      {error && <div style={{background:`${th.error}18`,border:`1px solid ${th.error}44`,borderRadius:8,padding:'12px 16px',color:th.error,marginBottom:18}}>⚠️ {error}</div>}

      {stage==='upload' && !preview && (
        <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${th.border}`,borderRadius:12,padding:'52px 24px',textAlign:'center',cursor:'pointer'}}
          onDragOver={e=>{e.preventDefault();(e.currentTarget as HTMLElement).style.borderColor=th.gold}}
          onDragLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=th.border}}
          onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.type.startsWith('image/'))loadFile(f)}}>
          <div style={{fontSize:42,marginBottom:14}}>📄</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Sube la foto de la factura</div>
          <div style={{fontSize:13,color:th.muted}}>Toca aquí o arrastra · JPG, PNG, WEBP, HEIC</div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])loadFile(e.target.files[0]);e.target.value=''}} />
        </div>
      )}

      {stage==='upload' && preview && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{position:'relative',borderRadius:8,overflow:'hidden',border:`1px solid ${th.border}`}}>
            <img src={preview} alt="Factura" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',background:'#111'}} />
            <button onClick={reset} style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.8)',border:`1px solid ${th.border}`,borderRadius:'50%',width:28,height:28,color:th.text,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
          <div style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:10,padding:20,display:'flex',flexDirection:'column',gap:16,justifyContent:'center'}}>
            <div>
              <h3 style={{fontSize:15,marginBottom:4}}>Imagen cargada ✓</h3>
              <p style={{fontSize:13,color:th.muted,lineHeight:1.6}}>Claude analizará la factura y extraerá todos los vestidos automáticamente.</p>
            </div>
            <button onClick={extract} style={{background:th.gold,border:'none',borderRadius:8,color:'#0D0D0D',padding:13,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>✨ Analizar con IA</button>
          </div>
        </div>
      )}

      {stage==='extracting' && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'56px 0'}}>
          <div style={{width:44,height:44,border:`3px solid ${th.border}`,borderTop:`3px solid ${th.gold}`,borderRadius:'50%',animation:'spin .8s linear infinite'}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{color:th.muted,fontSize:14}}>Analizando factura con IA...</div>
        </div>
      )}

      {(stage==='review'||stage==='saving') && (
        <div>
          {/* Info factura */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,background:th.surfaceAlt,border:`1px solid ${th.border}`,borderRadius:8,padding:'14px 16px',marginBottom:18}}>
            {[['Tienda','select'],['# Factura','text'],['Fecha','date']].map(([label,type])=>(
              <div key={label}>
                <div style={{fontSize:10,color:th.muted,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:5}}>{label}</div>
                {type==='select'
                  ? <select value={info.tienda} onChange={e=>setInfo(p=>({...p,tienda:e.target.value}))} style={{background:th.bg,border:`1px solid ${th.border}`,borderRadius:4,color:th.text,padding:'7px 9px',fontSize:13,width:'100%',fontFamily:'inherit'}}>
                      <option value="">Selecciona...</option>
                      {TIENDAS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  : <input type={type} value={label==='# Factura'?info.numero_factura:info.fecha}
                      onChange={e=>setInfo(p=>({...p,[label==='# Factura'?'numero_factura':'fecha']:e.target.value}))}
                      style={{background:th.bg,border:`1px solid ${th.border}`,borderRadius:4,color:th.text,padding:'7px 9px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none'}} />
                }
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:15}}>
              Vestidos &nbsp;
              <span style={{background:'rgba(201,168,76,.15)',color:th.gold,border:'1px solid rgba(201,168,76,.25)',borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700,fontFamily:'monospace'}}>{vestidos.length} filas · {styleKeys.filter(k=>!k.startsWith('_e')).length} estilos</span>
            </div>
            <button onClick={()=>setVestidos(p=>[...p,{_id:`v_${Date.now()}`,style_number:'',color:'',talla:'',cantidad:1,precio_usd:'',descripcion:''}])} style={{background:'transparent',border:`1px solid ${th.gold}`,color:th.gold,borderRadius:6,padding:'6px 14px',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>+ Agregar</button>
          </div>

          <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${th.border}`,marginBottom:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:th.surfaceAlt}}>
                  {['Style #','Color','Talla','Cant.','Precio USD','Descripción',''].map((h,i)=>(
                    <th key={i} style={{padding:'10px 9px',textAlign:'left',color:th.muted,fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',borderBottom:`1px solid ${th.border}`,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vestidos.map((v,i)=>{
                  const k = v.style_number||`_e${i}`
                  const bg = styleColor[k]||'transparent'
                  return (
                    <tr key={v._id} style={{background:bg}}>
                      {[
                        <input className="ci" style={{fontFamily:'monospace',fontWeight:700,color:th.gold}} value={v.style_number} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],style_number:e.target.value};return n})} />,
                        <input className="ci" value={v.color} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],color:e.target.value};return n})} />,
                        <input className="ci" value={v.talla} style={{textAlign:'center'}} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],talla:e.target.value};return n})} />,
                        <input className="ci" type="number" value={v.cantidad} style={{textAlign:'center'}} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],cantidad:e.target.value};return n})} />,
                        <input className="ci" type="number" value={v.precio_usd} step="0.01" onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],precio_usd:e.target.value};return n})} />,
                        <input className="ci" value={v.descripcion} onChange={e=>setVestidos(p=>{const n=[...p];n[i]={...n[i],descripcion:e.target.value};return n})} />,
                        <button onClick={()=>setVestidos(p=>p.filter((_,j)=>j!==i))} style={{background:'transparent',border:'none',color:th.error,cursor:'pointer',fontSize:15,padding:'2px 5px',opacity:.5}}>✕</button>
                      ].map((cell,ci)=><td key={ci} style={{padding:'5px 7px',borderBottom:`1px solid ${th.border}`,verticalAlign:'middle'}}>{cell}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <style>{`.ci{background:${th.surfaceAlt};border:1px solid ${th.border};border-radius:4px;color:${th.text};padding:4px 6px;font-size:12px;width:100%;font-family:inherit;outline:none}`}</style>
          </div>

          {/* Summary */}
          <div style={{display:'flex',gap:20,padding:'12px 16px',background:th.surfaceAlt,borderRadius:8,border:`1px solid ${th.border}`,marginBottom:16,flexWrap:'wrap'}}>
            <div style={{fontSize:13}}>Total piezas <strong>{totalPiezas}</strong></div>
            <div style={{fontSize:13}}>Total USD <strong style={{color:th.gold}}>{fmtUSD(totalUSD)}</strong></div>
          </div>

          {!info.tienda && <p style={{color:th.error,fontSize:13,marginBottom:10}}>⚠️ Selecciona la tienda antes de guardar.</p>}

          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button onClick={reset} style={{background:'transparent',border:`1px solid ${th.border}`,borderRadius:6,color:th.muted,padding:'9px 18px',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancelar</button>
            <button onClick={save} disabled={!info.tienda||vestidos.length===0||stage==='saving'}
              style={{background:th.gold,border:'none',borderRadius:6,color:'#0D0D0D',padding:'9px 20px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:stage==='saving'?.6:1}}>
              {stage==='saving' ? 'Guardando...' : `✓ Guardar en inventario (${vestidos.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TAB: Inventario ──────────────────────────────────────────
function TabInventario() {
  const [vestidos, setVestidos] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState('')
  const [soloDisp, setSoloDisp] = useState(false)

  useEffect(() => {
    fetch('/api/vestidos?all=true')
      .then(r=>r.json())
      .then(d=>{ setVestidos(d.data||[]); setLoading(false) })
  }, [])

  async function toggleVendido(v: any) {
    await fetch('/api/vestidos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id:v.id,vendido:!v.vendido}) })
    setVestidos(p=>p.map(x=>x.id===v.id?{...x,vendido:!x.vendido}:x))
  }

  async function updateCampo(id: string, campo: string, valor: string) {
    await fetch('/api/vestidos', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id,[campo]:valor}) })
  }

  function handleBlur(v: any, campo: string, valor: string) {
    if (String(v[campo]) === valor) return
    setVestidos(p=>p.map(x=>x.id===v.id?{...x,[campo]:valor}:x))
    updateCampo(v.id, campo, valor)
  }

  const filtrados = vestidos.filter(v => {
    const q = filtro.toLowerCase()
    const match = !q || v.style_number?.toLowerCase().includes(q) || v.color?.toLowerCase().includes(q) || v.tienda?.toLowerCase().includes(q)
    return match && (!soloDisp || !v.vendido)
  })

  if (loading) return <div style={{textAlign:'center',padding:40,color:th.muted}}>Cargando inventario...</div>

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input value={filtro} onChange={e=>setFiltro(e.target.value)} placeholder="Buscar por style#, color, tienda..."
          style={{flex:1,minWidth:200,background:th.surface,border:`1px solid ${th.border}`,borderRadius:8,color:th.text,padding:'10px 14px',fontSize:13,fontFamily:'inherit',outline:'none'}} />
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:th.muted,cursor:'pointer'}}>
          <input type="checkbox" checked={soloDisp} onChange={e=>setSoloDisp(e.target.checked)} />
          Solo disponibles
        </label>
        <div style={{fontSize:13,color:th.muted,display:'flex',alignItems:'center'}}>
          {filtrados.filter(v=>!v.vendido).length} disponibles / {filtrados.length} total
        </div>
      </div>

      <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${th.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:th.surfaceAlt}}>
              {['Style #','Tienda','Color','Talla','Cant.','Precio USD','Descripción','Estado',''].map((h,i)=>(
                <th key={i} style={{padding:'10px 9px',textAlign:'left',color:th.muted,fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',borderBottom:`1px solid ${th.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((v,i)=>(
              <tr key={v.id} style={{background:i%2===0?'transparent':th.surfaceAlt+'44',opacity:v.vendido?.7:1}}>
                <td style={{padding:'4px 7px',borderBottom:`1px solid ${th.border}`}}>
                  <input className="ci-inv" defaultValue={v.style_number} onBlur={e=>handleBlur(v,'style_number',e.target.value)} style={{fontFamily:'monospace',fontWeight:700,color:th.gold}} />
                </td>
                <td style={{padding:'8px 9px',borderBottom:`1px solid ${th.border}`,color:th.muted,fontSize:12}}>{v.tienda}</td>
                <td style={{padding:'4px 7px',borderBottom:`1px solid ${th.border}`}}>
                  <input className="ci-inv" defaultValue={v.color} onBlur={e=>handleBlur(v,'color',e.target.value)} />
                </td>
                <td style={{padding:'4px 7px',borderBottom:`1px solid ${th.border}`}}>
                  <input className="ci-inv" defaultValue={v.talla} onBlur={e=>handleBlur(v,'talla',e.target.value)} style={{textAlign:'center',fontFamily:'monospace',width:48}} />
                </td>
                <td style={{padding:'4px 7px',borderBottom:`1px solid ${th.border}`}}>
                  <input className="ci-inv" type="number" defaultValue={v.cantidad} onBlur={e=>handleBlur(v,'cantidad',e.target.value)} style={{textAlign:'center',width:52}} />
                </td>
                <td style={{padding:'4px 7px',borderBottom:`1px solid ${th.border}`}}>
                  <input className="ci-inv" type="number" step="0.01" defaultValue={v.precio_usd} onBlur={e=>handleBlur(v,'precio_usd',e.target.value)} style={{width:84}} />
                </td>
                <td style={{padding:'4px 7px',borderBottom:`1px solid ${th.border}`}}>
                  <input className="ci-inv" defaultValue={v.descripcion||''} onBlur={e=>handleBlur(v,'descripcion',e.target.value)} style={{minWidth:120}} />
                </td>
                <td style={{padding:'8px 9px',borderBottom:`1px solid ${th.border}`}}>
                  <span style={{background:v.vendido?`${th.error}22`:`${th.success}22`,color:v.vendido?th.error:th.success,border:`1px solid ${v.vendido?th.error:th.success}44`,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>
                    {v.vendido?'Vendido':'Disponible'}
                  </span>
                </td>
                <td style={{padding:'8px 9px',borderBottom:`1px solid ${th.border}`}}>
                  <button onClick={()=>toggleVendido(v)} style={{background:'transparent',border:`1px solid ${th.border}`,borderRadius:4,color:th.muted,padding:'3px 8px',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>
                    {v.vendido?'↩ Devolver':'✓ Vendido'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`.ci-inv{background:transparent;border:1px solid transparent;border-radius:4px;color:${th.text};padding:3px 5px;font-size:12px;width:100%;font-family:inherit;outline:none}.ci-inv:hover,.ci-inv:focus{background:${th.surfaceAlt};border-color:${th.border}}`}</style>
      </div>
    </div>
  )
}

// ── TAB: Precios ─────────────────────────────────────────────
function TabPrecios() {
  const [config, setConfig]   = useState({ tipo_cambio_usd_mxn:'18.00', markup_porcentaje:'100', cargo_adicional_mxn:'0', notas:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    fetch('/api/config').then(r=>r.json()).then(d=>{
      if (d.data) setConfig({ tipo_cambio_usd_mxn: String(d.data.tipo_cambio_usd_mxn), markup_porcentaje: String(d.data.markup_porcentaje), cargo_adicional_mxn: String(d.data.cargo_adicional_mxn), notas: d.data.notas||'' })
      setLoading(false)
    })
  }, [])

  async function guardar() {
    setSaving(true)
    await fetch('/api/config', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(config) })
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  // Ejemplo de cálculo
  const ejemplo = 319
  const enMXN   = ejemplo * parseFloat(config.tipo_cambio_usd_mxn||'0')
  const conMark = enMXN * (1 + parseFloat(config.markup_porcentaje||'0') / 100)
  const final   = Math.ceil(conMark + parseFloat(config.cargo_adicional_mxn||'0'))

  if (loading) return <div style={{textAlign:'center',padding:40,color:th.muted}}>Cargando...</div>

  return (
    <div style={{maxWidth:480}}>
      <h2 style={{fontSize:17,marginBottom:4}}>Configuración de Precios</h2>
      <p style={{color:th.muted,fontSize:13,marginBottom:24}}>Estos valores aplican a todos los vestidos al calcular el precio de venta.</p>

      {[
        { key:'tipo_cambio_usd_mxn', label:'Tipo de cambio USD → MXN', hint:'Ej: 18.50' },
        { key:'markup_porcentaje',   label:'Markup / Ganancia (%)',     hint:'100 = doble del costo' },
        { key:'cargo_adicional_mxn', label:'Cargo adicional (MXN)',     hint:'Flete, importación, etc.' },
      ].map(f=>(
        <div key={f.key} style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:11,color:th.muted,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:5}}>{f.label}</label>
          <input type="number" step="0.01" value={(config as any)[f.key]}
            onChange={e=>setConfig(p=>({...p,[f.key]:e.target.value}))}
            placeholder={f.hint}
            style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:8,color:th.text,padding:'12px 14px',fontSize:16,width:'100%',fontFamily:'inherit',outline:'none'}} />
          <div style={{fontSize:12,color:th.muted,marginTop:4}}>{f.hint}</div>
        </div>
      ))}

      <div key="notas" style={{marginBottom:24}}>
        <label style={{display:'block',fontSize:11,color:th.muted,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:5}}>Notas</label>
        <textarea value={config.notas} onChange={e=>setConfig(p=>({...p,notas:e.target.value}))} rows={2}
          style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:8,color:th.text,padding:'12px 14px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',resize:'vertical'}} />
      </div>

      {/* Preview de cálculo */}
      <div style={{background:th.surfaceAlt,border:`1px solid ${th.border}`,borderRadius:10,padding:'16px 18px',marginBottom:20}}>
        <div style={{fontSize:11,color:th.muted,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:10}}>Ejemplo de cálculo (vestido a $319 USD)</div>
        <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:5}}>
          <div style={{display:'flex',justifyContent:'space-between',color:th.muted}}><span>Costo en MXN</span><span style={{color:th.text}}>{fmtMXN(enMXN)}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',color:th.muted}}><span>+ Markup {config.markup_porcentaje}%</span><span style={{color:th.text}}>+{fmtMXN(enMXN*parseFloat(config.markup_porcentaje||'0')/100)}</span></div>
          {parseFloat(config.cargo_adicional_mxn||'0')>0 && <div style={{display:'flex',justifyContent:'space-between',color:th.muted}}><span>+ Cargo adicional</span><span style={{color:th.text}}>+{fmtMXN(parseFloat(config.cargo_adicional_mxn))}</span></div>}
          <div style={{borderTop:`1px solid ${th.border}`,marginTop:4,paddingTop:8,display:'flex',justifyContent:'space-between'}}><strong>Precio de venta</strong><strong style={{color:th.gold,fontSize:16}}>{fmtMXN(final)}</strong></div>
        </div>
      </div>

      <button onClick={guardar} disabled={saving} style={{background:th.gold,border:'none',borderRadius:8,color:'#0D0D0D',padding:'13px 24px',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit',width:'100%'}}>
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar configuración'}
      </button>
    </div>
  )
}
