import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css"
import "./highlight.css"
import { FontProvider } from "@/contexts/font-context"
import { NoteProvider } from "@/contexts/note-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

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
        <AuthProvider>
          <FontProvider>
            <NoteProvider>
              {children}
              <Toaster />
            </NoteProvider>
          </FontProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
