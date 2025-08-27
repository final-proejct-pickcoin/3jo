"use client"

import axios from "axios"
import { createContext, useContext, useState, useEffect } from "react"

// JWT 파서 유틸 함수
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT 파싱 실패:", e);
    return null;
  }
}


const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginError, setLoginError] = useState(null)
  const [token, setToken] = useState(null)

  // needPhone일 때 쓰는 전화번호 연결 요청
  const [phoneLinkRequest, setPhoneLinkRequest] = useState(null)

  // Google SDK 로드
  useEffect(() => {
    const loadGoogleSDK = async () => {
      if (!window.google?.accounts?.id) {
        await new Promise((resolve) => {
          const s = document.createElement("script")
          s.src = "https://accounts.google.com/gsi/client"
          s.async = true
          s.defer = true
          s.onload = resolve
          document.head.appendChild(s)
        })
      }
      console.log("구글 SDK 로드 완료")
    }
    loadGoogleSDK()

    // 로그인 상태 복원    
    const token = sessionStorage.getItem("auth_token")
    const userData = sessionStorage.getItem("user_data")

    if (token && userData) {
      console.log("로그인 시 유저데이타", userData)
      setUser(JSON.parse(userData))
    }
    
    setIsLoading(false)
    
  }, [])

  useEffect(()=>{
    const sessionToken = sessionStorage.getItem("auth_token");
    const localToken = localStorage.getItem("access_token");

    setToken(sessionToken);

    if (!sessionToken && !localToken) {
      window.location.href = "http://localhost:3000";
    }
  }, [])

  // 일반 로그인
  const login = async (email, password) => {
    setIsLoading(true)
    setLoginError(null)
    try {
      const formData = new URLSearchParams()
      formData.append("email", email)
      formData.append("password", password)

      const res = await fetch("http://localhost:8080/users/login", {
        method: "POST",
        body: formData,
      })
      console.log("res 값:", res)
      if (!res.ok) {
        const ErrorMsg = (await res.json())?.error || "로그인 실패"
        setLoginError(ErrorMsg)
        return
      }

      const data = await res.json()
      
      // 백엔드 응답: access_token, sub(email), user_id, name
      const profile = {
        user_id: data.user_id,
        email: data.sub,
        nickname: data.name || data.sub.split("@")[0],
      }

      // email 필드 유연 처리
      const userEmail = data.email || data.sub || email
      if (!userEmail) {
        setLoginError("이메일 정보를 가져오지 못했습니다.")
        return
      }

      // console.log("일반로그인 시 유저데이타", profile)
      sessionStorage.setItem("auth_token", data.access_token)
      sessionStorage.setItem(
        "user_data",
        JSON.stringify({user_id:data.user_id, email: userEmail, nickname: userEmail.split("@")[0] })
      )
      setUser({ email: userEmail, nickname: userEmail.split("@")[0] })
    } finally {
      setIsLoading(false)
    }
  }


  // 로그아웃
  const logout = () => {
    const userData = JSON.parse(sessionStorage.getItem("user_data"))
    const isKakaoUser = userData?.provider === "kakao"

    console.log("로그아웃 유저 정보:",userData)
    axios.delete("http://localhost:8080/users/logout", {
      params : {email : userData.email}
    })

    // 카카오 로그아웃
    if (isKakaoUser && window.Kakao?.Auth) {
      console.log("카카오 로그아웃 시도 중")
      window.Kakao.Auth.logout(() => {
        console.log("카카오 로그아웃 완료")
      })
    }

    // 세션 삭제
    sessionStorage.removeItem("auth_token")
    sessionStorage.removeItem("user_data")
    setUser(null)
    
  }


  // 회원가입
  const register = async (email, password, nickname, phone) => {
    setIsLoading(true)
    try {
      const normalizedPhone = normalizePhone(phone)

      const formData = new URLSearchParams()
      formData.append("email", email)
      formData.append("password", password)
      formData.append("name", nickname)
      //formData.append("phone", phone)
      formData.append("phone", normalizedPhone)

      const res = await fetch("http://localhost:8080/users/register", {
        method: "POST",
        // headers: {
        //   "Content-Type": "application/x-www-form-urlencoded",
        // },
        body: formData,
      })

      //  if (!res.ok) throw new Error("회원가입 실패")
      //  const data = await res.json()

      //  alert(data.success || data.error || "회원가입 완료! 이메일 인증 후 로그인하세요.")
      //  return data

      const text = await res.text()
      let data = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) {
        alert(data.error || text || "회원가입 실패")
        throw new Error(data.error || text || "회원가입 실패")
      }
      alert(data.success || "회원가입 완료! 이메일 인증 후 로그인하세요.")
      return data
    } finally {
      setIsLoading(false)
    }
  }

  // 전화번호 정규화 (숫자만, +82→0)
  const normalizePhone = (raw) => {
    let digits = String(raw || "").replace(/\D/g, "")
    if (digits.startsWith("82")) digits = "0" + digits.slice(2)
    return digits.slice(0, 11)
  }

  // 전화번호 OTP 요청
  const requestOtpForPhoneLink = async (phone) => {
    if (!phoneLinkRequest?.email) throw new Error("연결 대기(email) 없음")
    const normalized = normalizePhone(phone)
    const params = new URLSearchParams()
    params.append("email", phoneLinkRequest.email)
    params.append("phone", normalized)

    const res = await fetch("http://localhost:8080/users/phone/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    })

    const text = await res.text()
    let data = {}
    try { data = JSON.parse(text) } catch {}
    console.log("[OTP] status:", res.status, "body:", data || text)
    if (data?.debugOtp) alert(`개발모드 OTP: ${data.debugOtp}`)

    if (!res.ok) throw new Error("OTP 요청 실패")
    return true
  }

  // 링크 최종 완료
  const finalizePhoneLink = async ({ phone, otp }) => {
    if (!phoneLinkRequest) throw new Error("연결 대기 상태가 없습니다.")
    const normalized = normalizePhone(phone)

    const body = new URLSearchParams()
    body.append("provider", phoneLinkRequest.provider)
    if (phoneLinkRequest.providerId) body.append("providerId", phoneLinkRequest.providerId)
    body.append("email", phoneLinkRequest.email)
    body.append("phone", normalized)
    body.append("otp", otp)
    if (phoneLinkRequest.tempToken) body.append("temp_token", phoneLinkRequest.tempToken)

    const res = await fetch("http://localhost:8080/users/link-social", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    if (!res.ok) throw new Error("연결 실패")
    const data = await res.json()

    // 최종 로그인 완료
    const profile = {
      user_id: data.user_id,
      email: data.email || phoneLinkRequest.email,
      nickname: data.name || (data.email || phoneLinkRequest.email || "").split("@")[0],
      provider: data.provider || phoneLinkRequest.provider,
    }
    sessionStorage.setItem("auth_token", data.access_token)
    sessionStorage.setItem("user_data", JSON.stringify(profile))
    setUser(profile)
    setPhoneLinkRequest(null)
    return true
    }

  // 소셜 로그인(카카오/구글)
  const socialLogin = async (provider, email, providerId) => {
  try {
    const formData = new URLSearchParams()
    formData.append("provider", provider)
    formData.append("email", email)
    if (providerId) formData.append("providerId", providerId)

    const res = await fetch("http://localhost:8080/users/social-login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    })

    // 응답 파싱 (200/428 모두 커버)
    let data = {}
    try { data = await res.json() } catch {}

    // needPhone 체크
    const needPhone =
      res.status === 428 || data?.needPhone === true || data?.need_phone === true

    if (needPhone) {
      //  모달 열 스위치: phoneLinkRequest 세팅
      setPhoneLinkRequest({
        provider,
        providerId,
        email: data.socialEmail || data.email || email,
        // 백엔드가 temp_token 또는 access_token 중 임시토큰 비슷한 걸 줄 수 있어 둘 다 수용
        tempToken: data.temp_token || data.access_token || null,
      })
      // 상위에서 분기할 수 있도록 반환
      return { needPhone: true }
    }

    // 여기 왔으면 정상 로그인 케이스
    if (!res.ok) throw new Error("소셜 로그인 실패")

    const finalEmail = data.email || data.socialEmail || email
    const profile = {
      user_id: data.user_id,
      email: finalEmail,
      nickname: data.name || (finalEmail || "").split("@")[0],
      provider: data.provider || provider,
    }

    sessionStorage.setItem("auth_token", data.access_token)
    sessionStorage.setItem("user_data", JSON.stringify(profile))
    setUser(profile)
    return { needPhone: false }
  } catch (err) {
    console.error("소셜 로그인 오류:", err)
    alert("소셜 로그인 중 오류가 발생했습니다.")
    return { needPhone: false, error: true }
  }
}


  // OAuth 로그인 버튼 클릭 시
  const loginWithOAuth = async (provider) => {
    if (provider === "kakao") {
      if (!window.Kakao || !window.Kakao.Auth) {
        alert("카카오 SDK가 로드되지 않았습니다.")
        return { needPhone: false }
      }

      //API 호출
      return new Promise((resolve, reject) => {
        window.Kakao.Auth.login({
          scope: "account_email",
          success: () => {
            window.Kakao.API.request({
              url: "/v2/user/me",
              success: async (res) => {
                try {
                  const email = res?.kakao_account?.email
                  const kakaoId = res?.id
                  const ret = await socialLogin("kakao", email, kakaoId)
                  resolve(ret)                 // ← needPhone 결과를 상위(AuthModal)로 올려보냄
                } catch (e) { reject(e) }
              },
              fail: reject,
            })
          },
          fail: reject,
        })
      })
    }

    if (provider === "google") {
  const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
  console.log("🟢 [Google Login] CID from .env:", cid)

  if (!cid) {
    console.error("❌ Google Client ID가 비어있습니다. (.env 확인 필요)")
    return { needPhone: false } // ← 반드시 객체 반환(상위 분기용)
  }

  if (!window.google?.accounts?.id) {
    console.error("❌ Google SDK가 로드되지 않았습니다.")
    return { needPhone: false } // ← 반드시 객체 반환(상위 분기용)
  }

  // Promise로 감싸서 socialLogin() 결과(ret)를 resolve에 올려보냄
  return new Promise((resolve, reject) => {
    if (!window.__gsiInitialized) {
      console.log("GSI init start!!!")
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: async ({ credential }) => {
          console.log("📌 [Step 1] Credential 수신 여부:", credential)

          if (!credential) {
            console.warn("⚠️ credential이 비어있음. Google 로그인 실패")
            return resolve({ needPhone: false }) // ← 실패 시에도 객체 반환
          }

          try {
            // JWT payload 디코딩
            const payload = parseJwt(credential)
            console.log("📌 [Step 2] Google Payload:", payload)

            if (!payload?.email) {
              console.error("❌ 이메일 정보 없음");
              return resolve({ needPhone: false }) // ← 이메일 없으면 종료
            }

            // 백엔드로 전송
            console.log("📌 [Step 3] 백엔드로 social-login 요청 시작")
            const ret = await socialLogin("google", payload.email, payload.sub)
            console.log("✅ [Step 4] 백엔드 요청 완료", ret)

            // ✅ 핵심: needPhone 결과를 상위(AuthModal)로 올려보냄
            return resolve(ret)
          } catch (e) {
            console.error("❌ Google callback error:", e)
            return reject(e)
          }
        },
      })
    }

    // 버튼 렌더링
    const btn = document.getElementById("googleLoginBtn")
    if (btn) {
      console.log("🟢 renderButton on #googleLoginBtn")
      window.google.accounts.id.renderButton(btn, { theme: "outline", size: "large" })

      window.google.accounts.id.prompt((notification) => {
        console.log("🟢 prompt notification:", notification)
      })
    } else {
      console.warn("⚠️ #googleLoginBtn 요소 없음. DOM에 div 추가 필요")
    }

    window.__gsiInitialized = true
    console.log("🟢 GSI init done")
  })
}

  }
  // Context Provider 리턴
  return (
    <AuthContext.Provider
      value={{
        user,                 // { user_id, email, nickname }
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginError,
        loginWithOAuth,
        phoneLinkRequest,
        setPhoneLinkRequest,
        requestOtpForPhoneLink,
        finalizePhoneLink,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
