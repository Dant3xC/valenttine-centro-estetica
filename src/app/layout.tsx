import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: 'ERP Valenttine',
  description: 'Centro de Atención Médica Valenttine',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} ${poppins.variable}`}>
      <body className="min-h-screen page-enter font-sans antialiased">{children}
      </body>
    </html>
  )
}