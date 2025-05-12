import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css"
import { FontProvider } from "@/contexts/font-context"
import { NoteProvider } from "@/contexts/note-context"

export const metadata: Metadata = {
  title: "NoteItDown App",
  description: "A minimalist notes app",
  generator: 'Lily'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Default to mono font at initial render
  return (
    <html lang="en">
      <body className={GeistMono.className}>
        <FontProvider>
          <NoteProvider>
            {children}
          </NoteProvider>
        </FontProvider>
      </body>
    </html>
  )
}
