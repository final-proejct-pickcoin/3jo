"use client";
import React, { useEffect } from "react";

import { useState } from "react";
import { Eye, EyeOff, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Alert, AlertDescription } from "@/components_admin/ui/alert";
import axios from "axios";
export default function LoginForm({
  onLogin
}) {
  const [showPassword, setShowPassword] = useState(false);
  // const [step, setStep] = useState("login");
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 정보 FormData 형식으로 변환
    const formData = new FormData();
    formData.append("email", credentials.email);
    formData.append("password", credentials.password);

    // 컴포넌트 마운트 시 로컬스토리지에서 토큰 로드 (로그인 상태 복원)
    useEffect(()=>{
      const savedToken = localStorage.getItem("access_token");
      if (savedToken && savedToken !== "" && savedToken !== "null") {
        setToken(savedToken);
        // setStep("2fa");
        onLogin(); // 로그인 상태 업데이트
      }
    }, [])

    // 로그인 핸들러
  const handleLogin = async e => {
    e.preventDefault();
    // setIsLoading(true);
    setError("");

    // FastAPI에 로그인 정보 요청
    axios.post("http://localhost:8000/admin/login", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).then(response => {
      
      if(response.data.role === "ADMIN"){
        // console.log("로그인 성공:", response.data);
        // 토큰 저장
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("sub", response.data.sub);
        
        setToken(response.data.access_token);    // 상태 업데이트 추가
        
        onLogin();
        setError(null);
      }else if(response.data.role === "USER"){
        setError("관리자 계정이 아닙니다.");
      } else {
        setError("관리자 로그인에 실패했습니다.");
      }
    })
    .catch(error => {
      console.error("로그인 실패:", error);
      setError("로그인에 실패했습니다.");
    }).finally(() => {setIsLoading(false)})

  };

  return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-md shadow-lg border border-gray-200">
      <CardHeader className="text-center pb-8">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">PickCoin Admin</span>
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">관리자 로그인</CardTitle>
        <CardDescription className="text-gray-600">
          관리자 계정으로 로그인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <form onSubmit={handleLogin} className="space-y-4">
                        
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">관리자 ID</Label>
              <Input id="email" type="text" value={credentials.email} onChange={(e)=>setCredentials({...credentials, email: e.target.value})} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={credentials.password} onChange={(e)=>setCredentials({...credentials, password: e.target.value})} required disabled={isLoading} />
                {/* ...눈 아이콘 등 */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" className="w-full h-11 ...">로그인</Button>
            
          </form>
        ) : (
          <MainDashboardComponent onLogout={handleLogout} />
        )}
      </CardContent>
    </Card>
  </div>
);

  
}