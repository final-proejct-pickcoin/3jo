"use client";
import React from "react";

import { useState } from "react";
import { Eye, EyeOff, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Alert, AlertDescription } from "@/components_admin/ui/alert";
export default function LoginForm({
  onLogin
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("login");
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (credentials.username === "admin" && credentials.password === "admin123") {
      setStep("2fa");
    } else {
      setError("잘못된 관리자 계정입니다.");
    }
    setIsLoading(false);
  };
  const handle2FA = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 800));
    if (twoFactorCode === "123456") {
      onLogin();
    } else {
      setError("잘못된 인증 코드입니다.");
    }
    setIsLoading(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-gray-50 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "w-full max-w-md shadow-lg border border-gray-200"
  }, /*#__PURE__*/React.createElement(CardHeader, {
    className: "text-center pb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center space-x-3 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold text-xl"
  }, "P")), /*#__PURE__*/React.createElement("span", {
    className: "text-2xl font-bold text-gray-900"
  }, "PickCoin Admin")), /*#__PURE__*/React.createElement(CardTitle, {
    className: "text-xl font-semibold text-gray-900"
  }, "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778"), /*#__PURE__*/React.createElement(CardDescription, {
    className: "text-gray-600"
  }, step === "login" ? "관리자 계정으로 로그인하세요" : "2단계 인증을 완료하세요")), /*#__PURE__*/React.createElement(CardContent, null, step === "login" ? /*#__PURE__*/React.createElement("form", {
    onSubmit: handleLogin,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "username",
    className: "text-sm font-medium text-gray-700"
  }, "\uAD00\uB9AC\uC790 ID"), /*#__PURE__*/React.createElement(Input, {
    id: "username",
    type: "text",
    value: credentials.username,
    onChange: e => setCredentials({
      ...credentials,
      username: e.target.value
    }),
    placeholder: "\uAD00\uB9AC\uC790 ID\uB97C \uC785\uB825\uD558\uC138\uC694",
    className: "h-11",
    required: true,
    disabled: isLoading
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "password",
    className: "text-sm font-medium text-gray-700"
  }, "\uBE44\uBC00\uBC88\uD638"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "password",
    type: showPassword ? "text" : "password",
    value: credentials.password,
    onChange: e => setCredentials({
      ...credentials,
      password: e.target.value
    }),
    placeholder: "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694",
    className: "h-11 pr-10",
    required: true,
    disabled: isLoading
  }), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "ghost",
    size: "sm",
    className: "absolute right-0 top-0 h-11 px-3 hover:bg-transparent",
    onClick: () => setShowPassword(!showPassword),
    disabled: isLoading
  }, showPassword ? /*#__PURE__*/React.createElement(EyeOff, {
    className: "h-4 w-4"
  }) : /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4"
  })))), error && /*#__PURE__*/React.createElement(Alert, {
    variant: "destructive"
  }, /*#__PURE__*/React.createElement(AlertDescription, null, error)), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    className: "w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium",
    disabled: isLoading
  }, isLoading ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
  }), "\uB85C\uADF8\uC778 \uC911...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Shield, {
    className: "h-4 w-4 mr-2"
  }), "\uB85C\uADF8\uC778")), /*#__PURE__*/React.createElement("div", {
    className: "text-center text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("p", null, "\uB370\uBAA8 \uACC4\uC815: admin / admin123"))) : /*#__PURE__*/React.createElement("form", {
    onSubmit: handle2FA,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
  }, /*#__PURE__*/React.createElement(Smartphone, {
    className: "h-8 w-8 text-white"
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "\uBAA8\uBC14\uC77C \uC571\uC5D0\uC11C \uC0DD\uC131\uB41C 6\uC790\uB9AC \uC778\uC99D \uCF54\uB4DC\uB97C \uC785\uB825\uD558\uC138\uC694")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "2fa-code",
    className: "text-sm font-medium text-gray-700"
  }, "\uC778\uC99D \uCF54\uB4DC"), /*#__PURE__*/React.createElement(Input, {
    id: "2fa-code",
    type: "text",
    value: twoFactorCode,
    onChange: e => setTwoFactorCode(e.target.value),
    placeholder: "123456",
    maxLength: 6,
    className: "h-11 text-center text-lg tracking-widest font-mono",
    required: true,
    disabled: isLoading
  })), error && /*#__PURE__*/React.createElement(Alert, {
    variant: "destructive"
  }, /*#__PURE__*/React.createElement(AlertDescription, null, error)), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-3"
  }, /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "outline",
    className: "flex-1 h-11 bg-transparent",
    onClick: () => setStep("login"),
    disabled: isLoading
  }, "\uB4A4\uB85C"), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    className: "flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium",
    disabled: isLoading
  }, isLoading ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
  }), "\uC778\uC99D \uC911...") : "인증 완료")), /*#__PURE__*/React.createElement("div", {
    className: "text-center text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("p", null, "\uB370\uBAA8 \uCF54\uB4DC: 123456"))))));
}