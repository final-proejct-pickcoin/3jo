import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import { WebSocketProvider } from "@/components/websocket-provider" 
import { OnboardingProvider } from "@/components/onboarding-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { BookmarkProvider } from "@/components/bookmark-provider"
import "./globals.css"
import KakaoScript from "@/components/kakaoscript"
import Script from 'next/script'

const inter = Inter({ subsets: ["latin"] })

export const viewport = "width=device-width, initial-scale=1"

export const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "white" },
  { media: "(prefers-color-scheme: dark)", color: "black" },
]

export const metadata = {
  title: "CryptoVirtual - Virtual Cryptocurrency Trading Platform",
  description:
    "Master cryptocurrency trading without risk. Real-time market simulation with AI-powered insights, voice commands, and advanced analytics.",
  keywords: "cryptocurrency, trading, simulation, virtual trading, crypto portfolio, market analysis",
  authors: [{ name: "CryptoVirtual Team" }],
  generator: "v0.dev",
}

const RootLayout = ({ children }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192x192.png" />
    </head>
    <body className={inter.className}>
      {/* Script 컴포넌트 사용 */}
      <Script 
        src="https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js"
        strategy="beforeInteractive"
      />
      <KakaoScript />
       
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <WebSocketProvider>
            <OnboardingProvider>
              <BookmarkProvider>
                {children}
                <Toaster />
              </BookmarkProvider>                
            </OnboardingProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </body>
  </html>
)

export default RootLayout