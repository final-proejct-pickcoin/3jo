"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Alert, AlertDescription } from "@/components_admin/ui/alert";
import axios from "axios";
import SignUpModal from "@/components_admin/ui/signup-modal";

export default function LoginForm({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트 마운트 시 토큰 확인
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken && savedToken !== "" && savedToken !== "null") {
      onLogin();
    }
  }, [onLogin]);

  const handleInputChange = (field) => (e) => {
    setCredentials(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", credentials.email);
    formData.append("password", credentials.password);

    try {
      const response = await axios.post("http://localhost:8000/admin/login", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { role, access_token, sub, name } = response.data;

      if (role === "ADMIN") {
        // 토큰 저장
        Object.entries({ access_token, sub, name, role }).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
        onLogin();
        window.location.reload();
      } else if (role === "USER") {
        setError("관리자 계정이 아닙니다.");
      } else {
        setError("관리자 로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      setError("로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">관리자 ID</Label>
              <Input 
                id="email" 
                type="text" 
                value={credentials.email} 
                onChange={handleInputChange("email")} 
                required 
                disabled={isLoading} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={credentials.password} 
                  onChange={handleInputChange("password")} 
                  required 
                  disabled={isLoading} 
                />
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
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          
          <hr className="my-4" />
          
          <Button 
            variant="outline" 
            className="w-full h-11" 
            onClick={() => setModalOpen(true)}
          >
            회원가입
          </Button>
          
          <SignUpModal 
            isOpenSignUp={modalOpen} 
            onClose={() => setModalOpen(false)} 
          />
        </CardContent>
      </Card>
    </div>
  );
}