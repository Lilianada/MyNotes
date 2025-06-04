import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css"
import "../styles/markdown.css"
import "../styles/editor-preview.css"
import "../styles/monaco-editor.css"
import { FontProvider } from "@/contexts/font-context"
import { StorageProvider } from "@/contexts/storage-context"
import { UserPreferencesProvider } from "@/contexts/user-preferences-context"
import { Toaster } from "@/components/ui/toaster"
import { AppErrorBoundary } from "@/components/error-handling"
import { AutoHistoryCleanup } from "@/components/utils/auto-history-cleanup"
import { AuthProvider } from "@/contexts/auth-context"

export const metadata: Metadata = {
  title: "NoteItDown App",
  description: "A minimalist notes app",
  generator: 'Lily',
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Use GeistMono as the default font for better editing experience
  return (
    <html lang="en">
      <body className={GeistMono.className}>
        <AppErrorBoundary>
          <AuthProvider>
            <StorageProvider>
              <UserPreferencesProvider>
                <FontProvider>
                  {children}
                  <AutoHistoryCleanup />
                  <Toaster />
                </FontProvider>
              </UserPreferencesProvider>
            </StorageProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </body>
    </html>
  )
}
