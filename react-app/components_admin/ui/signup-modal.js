import axios from "axios";
import React, { useState } from "react";

  const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
  const springUrl  = process.env.NEXT_PUBLIC_SPRING_BASE_URL;
  const clean = (u) => (u || "").replace(/\/$/, "");

export default function SignUpModal({ isOpenSignUp, onClose }) {
  if (!isOpenSignUp) return null;

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("name", form.name);

    
    axios.post(`${clean(fastapiUrl)}/admin/register`, formData)
      .then((response) => {
        console.log("회원가입 성공", response.data);
        onClose();
      })
      .catch((error) => {
        console.error("회원가입 실패", error);
      });
    

    // TODO: 회원가입 API 호출
    console.log("회원가입 정보", form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">회원가입</h2>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input
            type="email"
            name="email"
            autoComplete="off"
            placeholder="이메일"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
        />
        <input
            type="text"
            name="name"
            autoComplete="off"
            placeholder="이름"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
        />
        <input
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
        />
        <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="비밀번호 확인"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
        />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-300 rounded"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded"
            >
              가입하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
