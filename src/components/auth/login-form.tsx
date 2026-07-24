"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/lib/validation/auth";
import type { z } from "zod";

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError(
        result.error === "ACCOUNT_SUSPENDED"
          ? "This account has been suspended. Contact support."
          : "Invalid email or password."
      );
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Log in</h1>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input type="email" {...register("email")} className="input" />
        {errors.email && <span className="text-red-600">{errors.email.message}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Password</span>
        <input type="password" {...register("password")} className="input" />
        {errors.password && <span className="text-red-600">{errors.password.message}</span>}
      </label>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Signing in…" : "Log in"}
      </button>

      <div className="flex justify-between text-sm">
        <a href="/forgot-password" className="text-slate-600 underline">
          Forgot password?
        </a>
        <a href="/register" className="text-slate-600 underline">
          Create account
        </a>
      </div>
    </form>
  );
}
