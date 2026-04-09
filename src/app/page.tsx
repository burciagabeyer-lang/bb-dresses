'use client'
import Link from 'next/link'
export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>👗</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>BB Dresses</h1>
        <p style={{ color: '#888880', fontSize: 14, margin: 0 }}>Sistema de inventario de vestidos de fiesta</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
        <Link href="/consulta" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#C9A84C', borderRadius: 12, padding: '18px 24px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
            <div style={{ color: '#0D0D0D', fontWeight: 700, fontSize: 16 }}>Consultar Vestido</div>
            <div style={{ color: '#0D0D0D', fontSize: 12, opacity: 0.7, marginTop: 2 }}>Busca por código de etiqueta</div>
          </div>
        </Link>
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 12, padding: '18px 24px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
            <div style={{ color: '#F0EDE8', fontWeight: 700, fontSize: 16 }}>Panel Admin</div>
            <div style={{ color: '#888880', fontSize: 12, marginTop: 2 }}>Subir facturas · Inventario · Precios</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
