"use client"

import "./globals.css"

/**
 * Last-resort boundary for errors in the root layout itself. It replaces
 * the whole document, so it renders its own <html> and <body>.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-AU">
      <body className="bg-canvas text-ink flex min-h-screen items-center justify-center px-4 text-center">
        <main role="alert">
          <h1 className="text-2xl tracking-tight">Something went wrong</h1>
          <p className="text-muted-ink mt-2 text-[15px]">The page couldn&apos;t be displayed. Try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="bg-ink hover:bg-ink-soft focus-visible:ring-ink mt-8 h-10 rounded-full px-5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
