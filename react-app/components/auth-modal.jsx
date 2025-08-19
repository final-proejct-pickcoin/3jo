"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Chrome, MessageCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import PhoneLinkDialog from "@/components/phoneLinkDialog";

export function AuthModal({ isOpen, onClose }) {
  const { login, register, loginWithOAuth, isLoading, loginError, phoneLinkRequest, setPhoneLinkRequest} = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phone : "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState({})

  const formatPhone = (value) => {
    // 숫자만 남기기
    const digits = value.replace(/\D/g, "").slice(0, 11); // 최대 11자리 숫자

    // 010-1234-5678 또는 010-123-4567 형태로 변환
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return digits.replace(/(\d{3})(\d+)/, "$1-$2");
    return digits.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  };

  const validateForm = (isSignUp) => {
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

  const handleSubmit = async (e, isSignUp) => {
    e.preventDefault()

    //  console.log("로그인 시도 값 확인:", formData.email, formData.password)

    if (!validateForm(isSignUp)) return

    try {
      if (isSignUp) {
        await register(formData.email, formData.password, formData.nickname, formData.phone)
        onClose()
      } else {
        await login(formData.email, formData.password)
        onClose()
      }
      
    } catch (error) {
      setErrors({ general: "Authentication failed. Please try again." })
    }
  }

  // needPhone이면 onClose 하지 않고 전화번호 모달을 띄우는 함수
  const handleOAuthLogin = async (provider) => {
    try {
      const ret = await loginWithOAuth(provider)              //  결과를 받아옴
      if (ret?.needPhone || phoneLinkRequest) {               //  needPhone 분기
        // setPhoneDialogOpen 같은 로컬 상태는 쓰지 않고, phoneLinkRequest 값으로 모달이 열림
        return                                                //  onClose() 호출하지 않음
      }
      // 성공적으로 로그인되면 모달 닫기
      onClose()
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

  // ★ 수정: 최상위 요소 하나가 되도록 Fragment로 감쌈
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">PickCoin</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            {loginError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>로그인</CardTitle>
                  <CardDescription>회원가입 시 입력한 회원 정보를 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">이메일</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="본인의 이메일을 입력하세요"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="비밀번호를 입력하세요"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "로그인 중..." : "로그인"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">간편 로그인</span>
                    </div>
                  </div>

                  {/* 구글 버튼 컨테이너 */}
                  <div id="googleLoginBtn" style={{ width: "100%" }} />

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>
                      <Chrome className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                    <Button variant="outline" onClick={() => handleOAuthLogin("kakao")} disabled={isLoading}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Kakao
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>계정 만들기</CardTitle>
                  <CardDescription>암호 시장 거래소인 선두주자 PickCoin 회원가입</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-nickname">닉네임</Label>
                      <Input
                        id="signup-nickname"
                        placeholder="사용할 닉네임을 입력하세요"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange("nickname", e.target.value)}
                        className={errors.nickname ? "border-destructive" : ""}
                      />
                      {errors.nickname && <p className="text-sm text-destructive">{errors.nickname}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">이메일</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="이메일을 입력하세요"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">전화번호</Label>
                      <Input
                        id="signup-phone"
                        type="text"
                        placeholder="휴대폰 번호를 입력하세요"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="8글자 이상 입력하세요"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">비밀번호 확인</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="비밀번호와 동일하게 입력하세요"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={errors.confirmPassword ? "border-destructive" : ""}
                      />
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", !!checked)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        서비스 약관과 개인정보 보호정책에 동의합니다.
                      </Label>
                    </div>
                    {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "계정 생성 중." : "계정 생성 완료"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">간편 회원가입</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>
                      <Chrome className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                    <Button variant="outline" onClick={() => handleOAuthLogin("kakao")} disabled={isLoading}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Kakao
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 전화번호 연결 모달 */}
      <PhoneLinkDialog
        open={!!phoneLinkRequest}
        onOpenChange={(v) => {
          if (!v) setPhoneLinkRequest(null)
        }}
      />
    </>
  )
}