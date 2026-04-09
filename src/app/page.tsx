'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const cream = '#FAF8F5', text = '#1A1A1A', gold = '#B8960C'
const grayL = '#E8E4DE', grayM = '#9C9690'
const serif = "'Playfair Display', Georgia, 'Times New Roman', serif"

function Splash({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60)
    const t2 = setTimeout(() => setFading(true), 2000)
    const t3 = setTimeout(onDone, 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      minHeight: '100vh', background: cream,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease',
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        *{box-sizing:border-box}
      `}</style>
      <div style={{
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <div style={{ fontFamily: serif, fontSize: 72, fontWeight: 700, color: gold, lineHeight: 1, marginBottom: 18 }}>BB</div>
        <div style={{ letterSpacing: '0.3em', fontSize: 14, color: text, textTransform: 'uppercase', marginBottom: 14 }}>DRESSES</div>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 13, color: grayM }}>by Sonia Beyer &amp; Ale Beyer</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [ready, setReady] = useState(false)
  const doneSplash = useCallback(() => setReady(true), [])

  if (!ready) return <Splash onDone={doneSplash} />

  return (
    <div style={{
      minHeight: '100vh', background: cream,
      fontFamily: 'system-ui,-apple-system,sans-serif', color: text,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        *{box-sizing:border-box}
        .card:hover{background:#FFFEFB!important;box-shadow:0 4px 20px rgba(184,150,12,.12)!important}
      `}</style>

      {/* Monograma */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, color: gold, lineHeight: 1, marginBottom: 10 }}>BB</div>
        <div style={{ letterSpacing: '0.28em', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>DRESSES</div>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: grayM }}>by Sonia Beyer &amp; Ale Beyer</div>
      </div>

      {/* Tarjetas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <Link href="/consulta" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            border: `1px solid ${gold}`, borderRadius: 2, padding: '22px 24px',
            textAlign: 'center', cursor: 'pointer', background: '#FFFFFF',
            transition: 'all .2s ease', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          }}>
            <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: text, marginBottom: 4 }}>Consultar Vestido</div>
            <div style={{ fontSize: 12, color: grayM }}>Busca precio y disponibilidad</div>
          </div>
        </Link>
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            border: `1px solid ${gold}`, borderRadius: 2, padding: '22px 24px',
            textAlign: 'center', cursor: 'pointer', background: gold,
            transition: 'all .2s ease',
          }}>
            <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Panel Admin</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Inventario · Facturas · Precios</div>
          </div>
        </Link>
      </div>

      <div style={{ position: 'absolute', bottom: 24, fontSize: 11, color: grayL, letterSpacing: '0.1em' }}>BB DRESSES ®</div>
    </div>
  )
}
