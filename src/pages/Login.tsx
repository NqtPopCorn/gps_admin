import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth, getHomePathForRole } from "@/contexts/AuthContext";

type AuthTab = "login" | "register";

export function Login() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const { login, register, isLoading, error, isAuthenticated, user } = useAuth();

  // Reset messages khi đổi tab
  useEffect(() => {
    setFormMessage(null);
    setShowPassword(false); // Reset trạng thái xem mật khẩu
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      const fallback = getHomePathForRole(user?.role);
      const destination = from === "/login" ? fallback : from;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, from, user?.role]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = (formData.get("password") as string)?.trim();

    if (!email || !password) {
      setFormMessage({ type: "error", text: "Vui lòng nhập đầy đủ email và mật khẩu." });
      return;
    }

    if (activeTab === "login") {
      const result = await login({ email, password });
      if (!result) {
        setFormMessage({ type: "error", text: error?.message || "Đăng nhập thất bại. Vui lòng thử lại." });
      }
    } else {
      const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

      // LOGIC FIX: Kiểm tra mật khẩu xác nhận
      if (password !== confirmPassword) {
        setFormMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
        return;
      }

      if (password.length < 6) {
        setFormMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự." });
        return;
      }

      const result = await register({ email, password, role: "partner" });
      if (!result) {
        setFormMessage({ type: "error", text: error?.message || "Đăng ký thất bại. Vui lòng thử lại." });
      } else {
        setFormMessage({ type: "success", text: "Đăng ký thành công! Vui lòng đăng nhập." });
        setActiveTab("login");
        // Lời khuyên: Có thể reset form ở đây nếu cần thiết
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      {/* Container chính */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex z-10">
        {/* Cột trái: Hình ảnh (Ẩn trên thiết bị di động) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-blue-900">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000"
            alt="Travel Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/40 to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
              <MapPin className="text-white w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Khám phá thế giới cùng chúng tôi</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Hệ thống quản lý đối tác và xuất bản các tour du lịch toàn cầu. Tham gia mạng lưới ngay hôm nay.
            </p>
          </div>
        </div>

        {/* Cột phải: Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-8 lg:p-12 flex flex-col justify-center">
          {/* Header (Hiển thị nổi bật trên mobile, thu gọn trên Desktop) */}
          <div className="text-center lg:text-left mb-8">
            <div className="mx-auto lg:mx-0 w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg lg:hidden mb-4">
              <MapPin className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === "login" ? "Chào mừng trở lại" : "Đăng ký Đối tác"}
            </h1>
            <p className="text-slate-500 mt-2">
              {activeTab === "login"
                ? "Đăng nhập vào hệ thống quản trị của bạn"
                : "Tạo tài khoản để bắt đầu quản lý các tour của bạn"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl mb-8">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Đăng nhập Admin
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Đăng ký Đối tác
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" onChange={() => setFormMessage(null)}>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="admin@system.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            {activeTab === "register" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            )}

            {/* Forgot Password Link (Chỉ ở tab Login) */}
            {activeTab === "login" && (
              <div className="flex justify-end">
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
            )}

            {/* Thông báo lỗi/thành công */}
            {formMessage && (
              <div
                className={`text-sm p-4 rounded-xl border flex items-start gap-2 ${
                  formMessage.type === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {formMessage.text}
              </div>
            )}

            {/* Nút Submit */}
            <button
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? "Đang xử lý..." : activeTab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
