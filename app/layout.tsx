import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css"
import "../styles/markdown.css"
import "../styles/editor-preview.css"
import "../styles/monaco-editor.css"
import { FontProvider } from "@/contexts/font-context"
import { NoteProvider } from "@/contexts/notes/note-context"
import { AuthProvider } from "@/contexts/auth-context"
import { StorageProvider } from "@/contexts/storage-context"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "NoteItDown App",
  description: "A minimalist notes app",
  generator: 'Lily',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Use GeistSans as the default font for better editing experience
  return (
    <html lang="en">
      <body className={GeistMono.className}>
        <AuthProvider>
          <StorageProvider>
            <FontProvider>
              <NoteProvider>
                {children}
                <Toaster />
              </NoteProvider>
            </FontProvider>
          </StorageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
