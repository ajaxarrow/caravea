import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"

import { SiteHeader } from "@/components/site-header"

import "./globals.css"

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | Caravea Workshop",
    default: "Workshop bookings | Caravea Workshop",
  },
  description: "Book caravans into the dealer's service bays.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${interTight.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="bg-ink sr-only z-50 rounded-full px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
