'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function NotFound() {
  // Add a bit of animation to make the page more engaging
  useEffect(() => {
    const interval = setInterval(() => {
      const element = document.getElementById('notFoundEmoji')
      if (element) {
        const emojis = ['😕', '🤔', '😮', '😵‍💫', '🧐']
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
        element.innerText = randomEmoji
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tighter">
            <span id="notFoundEmoji" className="inline-block mr-4 animate-bounce">
              😕
            </span>
            404
          </h1>
          <h2 className="text-3xl font-semibold tracking-tight">Page not found</h2>
          <p className="text-muted-foreground">
            We couldn't find the page you're looking for. The path might be incorrect, 
            or the page may have been moved or deleted.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}