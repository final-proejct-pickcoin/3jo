import { useState, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/admin";

// 스타일 상수
const modalStyles = {
  overlay: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",
  container: "bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg",
  title: "text-xl font-bold mb-4",
  form: "space-y-4",
  input: "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
  buttonContainer: "flex justify-end space-x-2",
  cancelButton: "px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 rounded transition-colors",
  submitButton: "px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
};

export default function SignUpModal({ isOpenSignUp, onClose }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Early return for closed modal
  if (!isOpenSignUp) return null;

  const createFormData = useCallback((formData) => {
    const data = new FormData();
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("name", formData.name);
    return data;
  }, []);

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = createFormData(form);
      await axios.post(`${API_BASE_URL}/register`, formData);
      onClose();
    } catch (error) {
      alert("회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [form, createFormData, onClose]);

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.container}>
        <h2 className={modalStyles.title}>회원가입</h2>
        <form onSubmit={handleSubmit} className={modalStyles.form}>
          {[
            { name: "email", type: "email", placeholder: "이메일" },
            { name: "name", type: "text", placeholder: "이름" },
            { name: "password", type: "password", placeholder: "비밀번호" },
            { name: "confirmPassword", type: "password", placeholder: "비밀번호 확인" }
          ].map(({ name, type, placeholder }) => (
            <input
              key={name}
              type={type}
              name={name}
              placeholder={placeholder}
              value={form[name]}
              onChange={handleChange}
              className={modalStyles.input}
              disabled={isLoading}
              required
            />
          ))}
          <div className={modalStyles.buttonContainer}>
            <button type="button" onClick={onClose} className={modalStyles.cancelButton} disabled={isLoading}>
              취소
            </button>
            <button type="submit" className={modalStyles.submitButton} disabled={isLoading}>
              {isLoading ? "가입 중..." : "가입하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
