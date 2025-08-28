"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"
import PhoneLinkDialog from "@/components/phoneLinkDialog"
import { Zap } from "lucide-react"

/** 
 * AuthModal의 로직/주석을 랜딩 페이지로 이식한 버전.
 * - useAuth 시그니처, 입력검증, OAuth 흐름(needPhone 분기), 구글 버튼 컨테이너(#googleLoginBtn) 그대로 유지
 * - 모달이 아니므로 onClose() 호출 부분은 제거(★ 변경)
 * - UI는 기존 LandingPage 카드 형태에 맞춰 배치
 */
export const LandingPage = () => {
  // -------------------- Auth 상태/함수(useAuth) --------------------
  // (AuthModal과 동일)  :contentReference[oaicite:2]{index=2}
  const { 
    login, 
    register, 
    loginWithOAuth, 
    isLoading, 
    loginError, 
    phoneLinkRequest, 
    setPhoneLinkRequest 
  } = useAuth()

  // -------------------- 로컬 상태 --------------------
  const [tab, setTab] = useState("login")
  const [showPassword, setShowPassword] = useState(false) // (AuthModal 동일)  :contentReference[oaicite:3]{index=3}
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phone: "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false) // 페이지 자체 스피너 용

  // -------------------- 유틸: 전화번호 포맷/검증 --------------------
  const formatPhone = (value) => {
    // 숫자만 남기기  :contentReference[oaicite:4]{index=4}
    const digits = value.replace(/\D/g, "").slice(0, 11) // 최대 11자리 숫자  :contentReference[oaicite:5]{index=5}

    // 010-1234-5678 또는 010-123-4567 형태로 변환  :contentReference[oaicite:6]{index=6}
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return digits.replace(/(\d{3})(\d+)/, "$1-$2")
    return digits.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")
  }

  const validateForm = (isSignUp) => {
    // (AuthModal 동일)  :contentReference[oaicite:7]{index=7}
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "이메일을 입력하세요."
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "이메일 형식이 올바르지 않습니다."
    }

    if (isSignUp) {
      if (!formData.phone) {
        newErrors.phone = "전화번호를 입력하세요."
      } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(formData.phone)) {
        newErrors.phone = "전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678"
      }
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력하세요."
    } else if (formData.password.length < 8) {
      newErrors.password = "비밀번호는 최소 8자 이상이어야 합니다."
    }

    if (isSignUp) {
      if (!formData.nickname) {
        newErrors.nickname = "닉네임을 입력하세요."
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 틀립니다."
      }

      if (!formData.agreeToTerms) {
        newErrors.terms = "서비스 약관에 동의해야 합니다."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // -------------------- 제출 핸들러 --------------------
  const handleSubmit = async (e, isSignUp) => {
    e.preventDefault()

    //  console.log("로그인 시도 값 확인:", formData.email, formData.password)  :contentReference[oaicite:8]{index=8}

    if (!validateForm(isSignUp)) return

    try {
      if (isSignUp) {
        // register(email, password, nickname, phone) (AuthModal 동일)  :contentReference[oaicite:9]{index=9}
        await register(formData.email, formData.password, formData.nickname, formData.phone)
        // 모달이 아니므로 onClose() 없음 (★ 변경)
      } else {
        await login(formData.email, formData.password)
        // 모달이 아니므로 onClose() 없음 (★ 변경)
      }
    } catch (error) {
      setErrors({ general: "Authentication failed. Please try again." })
    }
  }

  // needPhone이면 onClose 하지 않고 전화번호 모달을 띄우는 함수 (AuthModal 동일)  :contentReference[oaicite:10]{index=10}
  const handleOAuthLogin = async (provider) => {
    try {
      const ret = await loginWithOAuth(provider)              //  결과를 받아옴  :contentReference[oaicite:11]{index=11}
      if (ret?.needPhone || phoneLinkRequest) {               //  needPhone 분기  :contentReference[oaicite:12]{index=12}
        // setPhoneDialogOpen 같은 로컬 상태는 쓰지 않고, phoneLinkRequest 값으로 모달이 열림  :contentReference[oaicite:13]{index=13}
        return                                                //  onClose() 호출하지 않음  :contentReference[oaicite:14]{index=14}
      }
      // 성공적으로 로그인되면 추가 동작 필요 시 여기서 처리 (페이지 네비게이션 등)
    } catch (error) {
      setErrors({ general: `${provider} authentication failed. Please try again.` })
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // -------------------- 기타: 데모 로그인/스토리지 초기화 --------------------
  const handleClearStorage = () => { localStorage.clear(); window.location.reload() }
  const handleDemoLogin = async () => {
    try { setLoading(true); await login("demo@example.com", "password123") }
    finally { setLoading(false) }
  }

  // -------------------- 좌측 소개/지표 데이터 --------------------
  const stats = [
    { label: "활동 유저수", value: "50K+" },
    { label: "가상 거래", value: "2M+" },
    { label: "상장된 코인", value: "400+" },
    { label: "성공률", value: "94%" },
  ]
  const features = [
    { icon: () => <span className="i-lucide-trending-up text-xl" />, title: "실시간 마켓 시뮬레이션", description: "고급 트레이딩 뷰 차트를 통해 실시간 시장 상황을 경험하세요" },
    { icon: () => <span className="i-lucide-brain text-xl" />, title: "AI 기반 인사이트", description: "머신 러닝을 기반으로 한 개인 맞춤형 추천 및 시장 분석 제공" },
    { icon: () => <span className="i-lucide-mic text-xl" />, title: "음성 거래 어시스턴트", description: "자연스러운 음성 명령을 사용하여 거래를 할 수 있고 시장 업데이트 제공" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">pickCoin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClearStorage} className="text-xs">설정 초기화</Button>
            <ThemeToggle />
            <Button variant="outline" className="text-xs px-4 py-2" onClick={() => setTab("login")}>로그인</Button>
            <Button className="text-xs px-4 py-2" onClick={() => setTab("login")}>거래 시작</Button>
          </div>
        </div>
      </header>

      {/* Main 2단 레이아웃 */}
      <main className="flex flex-1 min-h-0">
        {/* 왼쪽: 소개/지표/버튼/필수기능 */}
        <section className="flex-1 flex flex-col justify-center items-center px-8 bg-white">
          <div className="max-w-2xl w-full text-center mt-8">
            <br/><br/><br/><br/>
            <h1 className="text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              <span className="inline-block align-middle">
                <span className="bg-gray-100 rounded px-2 py-1 text-xs font-bold text-gray-500 mr-2">PickCoin</span>
              </span><br/>
              픽코인 가상화폐 거래소<br />
              <span className="text-gray-800">음성 AI로 쉽게 배우는 코인거래!</span>
            </h1>
            <p className="text-base text-gray-500 mb-8">
              픽코인은 초보자도 쉽게 접근할 수 있도록 코인 거래에 대한 가이드를 제공하며,<br />
              말하는 AI의 도움을 받아 실시간 예측까지 받아보실 수 있습니다.
            </p>
            <div className="flex flex-row gap-4 justify-center mb-10">
              <Button className="px-7 py-3 rounded bg-black text-white font-semibold text-base shadow hover:bg-gray-900" onClick={() => setTab("login")}>거래 시작!</Button>
              <Button className="px-7 py-3 rounded border border-gray-300 bg-white text-black font-semibold text-base shadow hover:bg-gray-100" variant="outline" onClick={handleDemoLogin}>데모 모드 (빠른 시작)</Button>
            </div>
            <div className="grid grid-cols-4 gap-8 bg-white rounded-xl py-8 mb-8 shadow-sm border">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl font-extrabold mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-2">초보 거래자에게 필수</h2>
              <p className="text-base text-gray-500 mb-6">저희 플랫폼은 최첨단 기술과 직관적인 디자인을 결합하여 최고의 가상 거래 경험을 제공합니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="rounded-xl border bg-white p-6 text-left flex flex-col gap-2 shadow-sm">
                    <div>{feature.icon()}</div>
                    <div className="font-semibold text-lg">{feature.title}</div>
                    <div className="text-gray-500 text-sm">{feature.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 오른쪽: 카드형 로그인/회원가입 (AuthModal의 폼을 그대로 배치) */}
        <section className="flex-1 flex items-center justify-center relative min-h-[700px] bg-[#f7f5f2]" style={{backgroundImage:"url('/banner1.png')", backdropFilter:"blur(30px)", backgroundSize:"cover", backgroundPosition:"center"}}>
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-10 z-10 relative">
            <div className="flex mb-6 border-b border-gray-200">
              <button className={`flex-1 py-2 font-semibold text-lg border-b-2 ${tab === "login" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("login")}>로그인</button>
              <button className={`flex-1 py-2 font-semibold text-lg border-b-2 ${tab === "register" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("register")}>회원가입</button>
            </div>

            {loginError && (
              <div className="text-xs text-red-500 mb-3">{loginError}</div>  /* AuthModal의 Alert를 간소화하여 표시 */
            )}

            {tab === "login" ? (
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <h2 className="text-xl font-bold mb-2">로그인</h2>
                <p className="text-gray-500 text-sm mb-6">회원가입 시 입력한 회원 정보를 입력하세요</p>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">이메일</label>
                  <input
                    type="email"
                    className={`w-full border rounded px-3 py-2 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="본인의 이메일을 입력하세요"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full border rounded px-3 py-2 pr-10 ${errors.password ? "border-red-500" : ""}`}
                      placeholder="비밀번호를 입력하세요"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "숨김" : "표시"}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                {errors.general && <p className="text-xs text-red-500">{errors.general}</p>}

                <Button type="submit" className="w-full py-3 rounded bg-black text-white font-semibold text-base shadow hover:bg-gray-900" disabled={isLoading || loading}>
                  {isLoading || loading ? "로그인 중..." : "로그인"}
                </Button>

                {/* --- 간편 로그인 구분선 (AuthModal 동일) --- */}  {/*  :contentReference[oaicite:15]{index=15} */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">간편 로그인</span>
                  </div>
                </div>

                {/* 구글 버튼 컨테이너 */}  {/*  :contentReference[oaicite:16]{index=16} */}
                <div id="googleLoginBtn" style={{ width: "100%" }} />

                <div className="grid grid-cols-2 gap-4">
                  <Button type="button" variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>
                    Google
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleOAuthLogin("kakao")} disabled={isLoading}>
                    Kakao
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                <h2 className="text-xl font-bold mb-2">계정 만들기</h2>
                <p className="text-gray-500 text-sm mb-6">암호 시장 거래소인 선두주자 PickCoin 회원가입</p>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">닉네임</label>
                  <input
                    className={`w-full border rounded px-3 py-2 ${errors.nickname ? "border-red-500" : ""}`}
                    placeholder="사용할 닉네임을 입력하세요"
                    value={formData.nickname}
                    onChange={(e) => handleInputChange("nickname", e.target.value)}
                  />
                  {errors.nickname && <p className="text-xs text-red-500">{errors.nickname}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">이메일</label>
                  <input
                    type="email"
                    className={`w-full border rounded px-3 py-2 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">전화번호</label>
                  <input
                    type="text"
                    className={`w-full border rounded px-3 py-2 ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="휴대폰 번호를 입력하세요"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">비밀번호</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full border rounded px-3 py-2 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder="8글자 이상 입력하세요"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">비밀번호 확인</label>
                  <input
                    type="password"
                    className={`w-full border rounded px-3 py-2 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    placeholder="비밀번호와 동일하게 입력하세요"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange("agreeToTerms", !!e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-sm">서비스 약관과 개인정보 보호정책에 동의합니다.</label>
                </div>
                {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

                <Button type="submit" className="w-full py-3 rounded bg-black text-white font-semibold text-base shadow hover:bg-gray-900" disabled={isLoading || loading}>
                  {isLoading || loading ? "계정 생성 중." : "계정 생성 완료"}
                </Button>

                {/* --- 간편 회원가입 구분선 (AuthModal 동일) --- */}  {/*  :contentReference[oaicite:17]{index=17} */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">간편 회원가입</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button type="button" variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>
                    Google
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleOAuthLogin("kakao")} disabled={isLoading}>
                    Kakao
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* 푸터 (기존 Landing 유지) */}
      <footer className="border-t bg-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">PickCoin</span>
              </div>
              <p className="text-sm text-gray-500">차세대 가상 암호화폐 거래 플랫폼.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>트레이딩 시뮬레이터</li>
                <li>시장 분석가</li>
                <li>포트폴리오 트래커</li>
                <li>AI 어시스턴스</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>문서</li>
                <li>API 참조</li>
                <li>커뮤니티</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>About Us</li>
                <li>개인정보 정책</li>
                <li>서비스 약관</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 PickCoin. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 전화번호 연결 모달 (AuthModal 동일) */}  {/*  :contentReference[oaicite:18]{index=18} */}
      <PhoneLinkDialog
        open={!!phoneLinkRequest}
        onOpenChange={(v) => {
          if (!v) setPhoneLinkRequest(null)
        }}
      />
    </div>
  )
}