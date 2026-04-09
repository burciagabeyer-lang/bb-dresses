import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BB Dresses',
  description: 'Sistema de inventario de vestidos de fiesta',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#0D0D0D', color: '#F0EDE8', fontFamily: 'Georgia, serif', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
