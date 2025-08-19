"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";

// ★ NEW: 전화번호 정규화 (숫자만, +82→0)
const normalizePhone = (raw) => {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("82")) digits = "0" + digits.slice(2);
  return digits.slice(0, 11);
};

export default function PhoneLinkDialog({ open, onOpenChange }) {
  const {
    phoneLinkRequest,       // { provider, providerId, email, tempToken }
    setPhoneLinkRequest,    // 연결 취소/완료 시 null로
    requestOtpForPhoneLink, // OTP 요청
    finalizePhoneLink,      // 최종 연결(+로그인)
  } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!phoneLinkRequest) return null;

  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      const ok = await requestOtpForPhoneLink(normalizePhone(phone));
      if (ok) setStep(2);
    } catch (e) {
      alert(e.message || "OTP 요청 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      await finalizePhoneLink({ phone: normalizePhone(phone), otp });
      // 성공: 연결 상태 해제 및 모달 닫기
      setPhoneLinkRequest(null);
      onOpenChange(false);
    } catch (e) {
      alert(e.message || "연결 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (v) => {
    if (!v) setPhoneLinkRequest(null);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>전화번호로 소셜 계정 연결</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>휴대폰 번호</Label>
              <Input
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button onClick={handleRequestOtp} disabled={loading || !phone}>
              인증번호 받기
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label>인증번호</Label>
              <Input
                placeholder="6자리"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>
            <Button onClick={handleFinalize} disabled={loading || !otp}>
              연결하고 로그인
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}