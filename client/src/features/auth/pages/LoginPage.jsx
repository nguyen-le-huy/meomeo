import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { loginApi } from "../services/authApi.js";
import { useAuthStore } from "../stores/authStore.js";

const catImageUrl =
  "https://res.cloudinary.com/dknin0hhf/image/upload/v1781600479/Cat_Smile_Sticker_by_CHERRISK_l4h8vh.gif";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tài khoản"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values) {
    setLoginError("");

    try {
      const response = await loginApi({
        email: values.username,
        password: values.password,
      });
      const { user, token } = response.data.data;

      setAuth({ user, token });

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginError(error.response?.data?.message || "Đăng nhập thất bại");
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-matcha px-4 py-4 text-coal sm:px-6 sm:py-7">
      <section className="relative mx-auto h-full max-w-[900px] overflow-hidden rounded-[18px] bg-white shadow-[0_1px_0_#222222]">
        <div className="absolute right-14 top-7 z-10 hidden sm:block">
          <button className="rounded-full bg-coal px-12 py-3.5 text-sm font-medium text-matcha shadow-sm transition hover:bg-black">
            Sign in
          </button>
        </div>

        <img
          alt="Smiling cat"
          className="pointer-events-none absolute right-[-6px] top-[86px] z-0 h-[250px] w-[180px] object-contain sm:right-[-4px] sm:top-[112px] sm:h-[226px] sm:w-[190px]"
          src={catImageUrl}
        />

        <div className="relative z-10 flex h-full items-center justify-center px-5 py-16 sm:px-10 sm:py-20">
          <div className="w-full max-w-[520px] sm:ml-2 sm:mr-20">
            <div className="mb-9">
              <h1 className="text-[28px] font-bold leading-tight tracking-normal text-coal sm:text-[38px]">
                Vào học nhanh
              </h1>
              <p className="mt-3 text-sm font-normal text-coal/55">Đăng nhập đi</p>
            </div>

            <form autoComplete="off" className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  className="mb-2.5 block text-sm font-semibold text-coal"
                  htmlFor="login-username"
                >
                  Tài khoản
                </label>
                <input
                  autoComplete="off"
                  className="h-14 w-full rounded-md border border-coal/70 px-7 text-base font-semibold text-coal outline-none transition placeholder:text-coal/35 focus:border-coal focus:ring-2 focus:ring-coal/15"
                  id="login-username"
                  type="text"
                  {...register("username")}
                />
                {errors.username ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.username.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-medium text-coal/55" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className="h-14 w-full rounded-md border border-coal/30 px-7 pr-14 text-base font-semibold text-coal outline-none transition placeholder:text-coal/35 focus:border-coal focus:ring-2 focus:ring-coal/15"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-coal/55"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    <span className="relative block h-[14px] w-[20px] rounded-full border-2 border-current">
                      <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                    </span>
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              {loginError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {loginError}
                </div>
              ) : null}

              <button
                className="h-14 w-full rounded-md bg-coal text-base font-semibold text-matcha shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-6 rounded-md bg-matcha/40 px-4 py-3 text-sm text-coal/70">
              <p>Admin: admin / 123456</p>
              <p>Student: meomeo / 123456</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
