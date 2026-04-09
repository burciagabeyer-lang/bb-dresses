import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BB Dresses',
  description: 'Sistema de inventario de vestidos de fiesta',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ margin: 0, padding: 0, height: '100%', overflow: 'hidden', background: '#FAF8F5', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
