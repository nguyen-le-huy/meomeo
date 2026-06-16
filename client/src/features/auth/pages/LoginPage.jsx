import { useState } from "react";
import { useForm } from "react-hook-form";

const catImageUrl =
  "https://res.cloudinary.com/dknin0hhf/image/upload/v1781600479/Cat_Smile_Sticker_by_CHERRISK_l4h8vh.gif";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: "info.madhu786@gmail.com",
      password: "password",
      remember: true,
    },
  });

  function onSubmit() {
    // Backend login will be connected in the auth feature step.
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f3f3f3] px-4 py-4 text-[#060a3d] sm:px-6 sm:py-7">
      <section className="relative mx-auto h-full max-w-[900px] overflow-hidden bg-white shadow-[0_1px_0_#b4d28e]">
        <div className="absolute right-14 top-7 z-10 hidden sm:block">
          <button className="rounded-full bg-black px-12 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1b1b1b]">
            Sign in
          </button>
        </div>

        <img
          alt="Smiling cat"
          className="pointer-events-none absolute right-[-6px] top-[86px] z-0 h-[156px] w-[126px] object-contain sm:right-[-4px] sm:top-[112px] sm:h-[226px] sm:w-[190px]"
          src={catImageUrl}
        />

        <div className="relative z-10 flex h-full items-center justify-center px-5 py-16 sm:px-10 sm:py-20">
          <div className="w-full max-w-[520px] sm:ml-2 sm:mr-20">
            <div className="mb-9">
              <h1 className="text-[28px] font-bold leading-tight tracking-normal text-[#060a3d] sm:text-[38px]">
                Welcome Back to Realnest!
              </h1>
              <p className="mt-3 text-sm font-normal text-[#9a9aaa]">Sign in your account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-[#11143f]" htmlFor="email">
                  Your Email
                </label>
                <input
                  className="h-14 w-full rounded-md border border-[#0a0b35] px-7 text-base font-semibold text-[#17193f] outline-none transition placeholder:text-[#b8b8c7] focus:border-[#151655] focus:ring-2 focus:ring-[#11143f]/15"
                  id="email"
                  type="email"
                  {...register("email")}
                />
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-medium text-[#9d9cac]" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="h-14 w-full rounded-md border border-[#b9bac4] px-7 pr-14 text-base font-semibold text-[#17193f] outline-none transition placeholder:text-[#b8b8c7] focus:border-[#151655] focus:ring-2 focus:ring-[#11143f]/15"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#8a8b9b]"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    <span className="relative block h-[14px] w-[20px] rounded-full border-2 border-current">
                      <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 font-medium text-[#252746]">
                  <input
                    className="h-3.5 w-3.5 accent-black"
                    type="checkbox"
                    {...register("remember")}
                  />
                  Remember Me
                </label>
                <a className="font-medium text-[#a2a1b3] hover:text-[#060a3d]" href="/login">
                  Forgot Password?
                </a>
              </div>

              <button
                className="h-14 w-full rounded-md bg-[#17181b] text-base font-semibold text-white shadow-sm transition hover:bg-black"
                type="submit"
              >
                Login
              </button>
            </form>

            <p className="mt-14 text-center text-sm font-medium text-[#9d9cac]">
              Don&apos;t have any account?{" "}
              <a className="font-bold text-[#1f79c8]" href="/login">
                Register
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
