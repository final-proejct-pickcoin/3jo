"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/components/auth-provider"
import { TrendingUp, Shield, Brain, Mic, BarChart3, Users, Smartphone, Globe, Zap, Lock } from "lucide-react"

export const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { login, loginError } = useAuth()

  useEffect(() => {
    if (loginError) setShowAuthModal(true) //로그인 실패 모달 자동 열림
  }, [loginError])

  const handleDemoLogin = async () => { try { await login("demo@example.com", "password123") } catch (e) { console.error("Demo login failed:", e) } }
  const handleClearStorage = () => { localStorage.clear(); window.location.reload() }
  const features = [
    { icon: TrendingUp, title: "실시간 마켓 시뮬레이션", description: "고급 트레이딩 뷰 차트를 통해 실시간 시장 상황을 경험하세요" },
    { icon: Brain, title: "AI 기반 인사이트", description: "머신 러닝을 기반으로 한 개인 맞춤형 추천 및 시장 분석 제공" },
    { icon: Mic, title: "음성 거래 어시스턴트", description: "자연스러운 음성 명령을 사용하여 거래를 할 수 있고 시장 업데이트 제공" },
    { icon: Shield, title: "안전 거래 환경", description: "완전히 안전한 환경에서 가상 펀드와 거래 전략 연습하기" },
    { icon: BarChart3, title: "한 발 앞선 분석", description: "실시간 P&L 계산 및 위험 지표를 통해 포트폴리오 성과 추적" },
    { icon: Users, title: "커뮤니티로 정보 공유", description: "고수 트레이더와 연결하고 인사이트를 공유하며 커뮤니티에서 배우기" },
  ]
  const stats = [
    { label: "활동 유저수", value: "50K+" },
    { label: "가상 거래", value: "2M+" },
    { label: "상장된 코인", value: "400+" },
    { label: "성공률", value: "94%" },
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
              <h1 className="text-xl font-bold">pickCoin</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleClearStorage} className="text-xs">
                설정 초기화
              </Button>
              <ThemeToggle />
              <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                로그인
              </Button>
              <Button onClick={() => setShowAuthModal(true)}>거래 시작</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 PickCoin
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            픽코인 가상화폐 거래소
            <br />
            음성 AI로 쉽게 배우는 코인거래!
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            픽코인은 초보자도 쉽게 접근할 수 있도록 코인 거래에 대한 가이드를 제공하며,
            말하는 AI의 도움을 받아 실시간 예측까지 받아보실 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setShowAuthModal(true)} className="text-lg px-8">
              거래 시작!
            </Button>
            <Button size="lg" variant="outline" onClick={handleDemoLogin} className="text-lg px-8 bg-transparent">
              데모 모드 (빠른 시작)
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">초보 거래자에게 필수</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              저희 플랫폼은 최첨단 기술과 직관적인 디자인을 결합하여 최고의 가상 거래 경험을 제공합니다.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">현대 기술로 제작</h2>
            <p className="text-xl text-muted-foreground">신뢰할 수 있는 엔터프라이즈급 보안 및 성능</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle>실시간 데이터</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  즉각적인 업데이트와 초보자를를 위한 실시간 시장 데이터 거래 시뮬레이션.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>높은 수준의 보안</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  사용자 토큰 암호화 및 데이터 보호를 위한 종합적인 보안 조치와 사생활.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-primary mb-2" />
                <CardTitle>모바일 연동 디자인</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  오프라인 기능을 갖춘 완벽한 반응형 PWA로, 모든 기기와 화면 크기에 최적화되어 있습니다.
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
              <CardTitle className="text-3xl mb-4">픽코인과 함께 할 준비가 되셨나요?</CardTitle>
              <CardDescription className="text-lg">
                고급 시뮬레이션을 통해 이미 암호화폐 시장을 장악하고 있는 수천 명의 트레이더와 함께하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => setShowAuthModal(true)} className="text-lg px-12">
                계정 만들기
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                신용카드 필요 없음 - 바로 거래 시작
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
                <span className="font-bold">PickCoin</span>
              </div>
              <p className="text-sm text-muted-foreground">
                차세대 가상 암호화폐 거래 플랫폼.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>트레이딩 시뮬레이터</li>
                <li>시장 분석가</li>
                <li>포트폴리오 트래커</li>
                <li>AI 어시스턴스</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>문서</li>
                <li>API 참조</li>
                <li>커뮤니티</li>
                
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>개인정보 정책</li>
                <li>서비스 약관</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 PickCoin. All rights reserved.
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
