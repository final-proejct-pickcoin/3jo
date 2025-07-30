"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/components/auth-provider"
import { TrendingUp, Shield, Brain, Mic, BarChart3, Users, Smartphone, Globe, Zap, Lock } from "lucide-react"

export const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { login } = useAuth()
  const handleDemoLogin = async () => { try { await login("demo@example.com", "password123") } catch (e) { console.error("Demo login failed:", e) } }
  const handleClearStorage = () => { localStorage.clear(); window.location.reload() }
  const features = [
    { icon: TrendingUp, title: "Real-Time Market Simulation", description: "Experience live market conditions with Bithumb API integration and advanced TradingView charts" },
    { icon: Brain, title: "AI-Powered Insights", description: "Get personalized recommendations and market analysis powered by machine learning" },
    { icon: Mic, title: "Voice Trading Assistant", description: "Execute trades and get market updates using natural voice commands" },
    { icon: Shield, title: "Risk-Free Environment", description: "Practice trading strategies with virtual funds in a completely safe environment" },
    { icon: BarChart3, title: "Advanced Analytics", description: "Track portfolio performance with real-time P&L calculations and risk indicators" },
    { icon: Users, title: "Community Features", description: "Connect with other traders, share insights, and learn from the community" },
  ]
  const stats = [
    { label: "Active Users", value: "50K+" },
    { label: "Virtual Trades", value: "2M+" },
    { label: "Supported Coins", value: "500+" },
    { label: "Success Rate", value: "94%" },
  ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 text-foreground backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">CryptoVirtual</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleClearStorage} className="text-xs">
                Reset
              </Button>
              <ThemeToggle />
              <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                Sign In
              </Button>
              <Button onClick={() => setShowAuthModal(true)}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Next-Generation Virtual Trading Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Master Crypto Trading!
            <br />
            Without the Risk
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience real-time cryptocurrency markets with AI-powered insights, voice commands, and advanced
            analytics—all in a completely risk-free environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setShowAuthModal(true)} className="text-lg px-8">
              Start Trading Now
            </Button>
            <Button size="lg" variant="outline" onClick={handleDemoLogin} className="text-lg px-8 bg-transparent">
              Try Demo (Quick Access)
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with intuitive design to create the ultimate virtual trading
              experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-muted-foreground">Enterprise-grade security and performance you can trust</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Real-Time Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Live market data from Bithumb API with WebSocket connections for instant updates and zero-latency
                  trading simulation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Bank-Level Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  JWT authentication, BCrypt encryption, and comprehensive security measures to protect your data and
                  privacy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Mobile-First Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fully responsive PWA with offline capabilities, optimized for all devices and screen sizes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">Ready to Start Your Journey?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of traders who are already mastering cryptocurrency markets with our advanced simulation
                platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => setShowAuthModal(true)} className="text-lg px-12">
                Create Free Account
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required • Start trading in 30 seconds
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">CryptoVirtual</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The next-generation virtual cryptocurrency trading platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Trading Simulator</li>
                <li>Market Analysis</li>
                <li>Portfolio Tracker</li>
                <li>AI Assistant</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Community</li>
                <li>Support</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 CryptoVirtual. All rights reserved.
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
