import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { loginApi } from "../services/authApi.js";
import { useAuthStore } from "../stores/authStore.js";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tài khoản"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { formState: { errors, isSubmitting }, handleSubmit, register } = useForm({
    defaultValues: { username: "", password: "" },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values) {
    setLoginError("");
    try {
      const response = await loginApi({ email: values.username, password: values.password });
      const { user, token } = response.data.data;
      setAuth({ user, token });
      navigate("/", { replace: true });
    } catch (error) {
      setLoginError(error.response?.data?.message || "Đăng nhập thất bại");
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between">
        <Link aria-label="Meomeo home" className="inline-flex items-center" to="/">
          <img alt="Meomeo" className="h-10 w-10 object-contain" src="https://res.cloudinary.com/dknin0hhf/image/upload/v1781682627/Black_Cat_Sticker_psynzk.gif" />
        </Link>
        <Button asChild variant="ghost">
          <Link to="/"><ArrowLeft size={16} /> Về thư viện</Link>
        </Button>
      </div>

      <section className="mx-auto mt-10 grid max-w-[1180px] overflow-hidden rounded-2xl border border-[#e6dfd8] bg-cream lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[#181715] p-12 text-canvas lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="eyebrow !text-[#a09d96]">Admin workspace</p>
            <h1 className="mt-8 max-w-lg font-display text-6xl leading-[1.05] tracking-tight">
              Nội dung tốt bắt đầu từ từng câu chữ.
            </h1>
          </div>
          <div className="relative">
            <div className="absolute -bottom-32 -right-28 h-80 w-80 rounded-full border-[55px] border-coral/90" />
            <p className="relative max-w-sm text-sm leading-6 text-[#a09d96]">
              Thêm video, chỉnh transcript và xuất bản bài học ngay trong giao diện công khai.
            </p>
          </div>
        </div>

        <div className="flex items-center p-6 sm:p-10 lg:p-14">
          <Card className="w-full border-0 bg-transparent">
            <CardContent className="p-0">
              <div className="mb-10">
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-coral text-white">
                  <LockKeyhole size={20} />
                </span>
                <h2 className="font-display text-4xl font-normal tracking-tight">Đăng nhập admin</h2>
                <p className="mt-3 text-sm leading-6 text-ink-muted">Khu vực này chỉ dành cho người quản trị nội dung.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="mb-2 block text-sm font-semibold" htmlFor="login-username">Tài khoản</label>
                  <Input autoComplete="username" className="h-12" id="login-username" placeholder="admin@example.com" {...register("username")} />
                  {errors.username ? <p className="mt-2 text-sm text-red-600">{errors.username.message}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold" htmlFor="password">Mật khẩu</label>
                  <div className="relative">
                    <Input autoComplete="current-password" className="h-12 pr-12" id="password" type={showPassword ? "text" : "password"} {...register("password")} />
                    <Button aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-1.5 top-1.5" onClick={() => setShowPassword((value) => !value)} size="icon" type="button" variant="ghost">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </Button>
                  </div>
                  {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
                </div>

                {loginError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loginError}</div> : null}

                <Button className="h-12 w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
