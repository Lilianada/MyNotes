"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useFont } from '@/contexts/font-context'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export default function FontSwitcher({ children }: { children: ReactNode }) {
  const { fontType } = useFont()
  const [mounted, setMounted] = useState(false)
  
  // Only show the UI once mounted on the client
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return null
  }
  
  return (
    <div className={fontType === 'mono' ? GeistMono.className : GeistSans.className}>
      {children}
    </div>
  )
}
