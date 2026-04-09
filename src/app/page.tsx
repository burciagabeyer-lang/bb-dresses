'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const cream = '#FAF8F5'
const gold  = '#B8960C'
const text  = '#1A1A1A'
const byline = '#9A8A7A'

function Splash({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2300)
    const t2 = setTimeout(onDone, 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div style={{
      minHeight: '100vh', background: cream,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease',
    }}>
      <style>{`
        @keyframes fi{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box}
      `}</style>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {/* Línea superior */}
        <div style={{
          width: 60, height: 1, background: gold,
          opacity: 0, animation: 'fi 0.8s ease forwards', animationDelay: '0s',
        }} />

        {/* Monograma BB */}
        <div style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 96, fontWeight: 700, color: gold, lineHeight: 1,
          opacity: 0, animation: 'fi 0.6s ease forwards', animationDelay: '0.4s',
        }}>BB</div>

        {/* DRESSES */}
        <div style={{
          letterSpacing: '0.5em', fontSize: 11, color: text,
          textTransform: 'uppercase', paddingLeft: '0.5em',
          opacity: 0, animation: 'fi 0.5s ease forwards', animationDelay: '0.8s',
        }}>DRESSES</div>

        {/* Línea inferior */}
        <div style={{
          width: 60, height: 1, background: gold,
          opacity: 0, animation: 'fi 0.8s ease forwards', animationDelay: '1s',
        }} />

        {/* By line */}
        <div style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic', fontSize: 13, color: byline,
          opacity: 0, animation: 'fi 0.5s ease forwards', animationDelay: '1.2s',
        }}>by Sonia Beyer &amp; Ale Beyer</div>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const done = useCallback(() => router.push('/admin'), [router])
  return <Splash onDone={done} />
}
