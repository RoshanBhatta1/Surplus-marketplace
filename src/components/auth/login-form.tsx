"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/auth";
import { DemoNotice } from "@/components/demo/demo-notice";
import type { z } from "zod";

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit() {
    // No backend in this demo build.
    setSubmitted(true);
  }

  if (submitted) {
    return <DemoNotice message="This is a UI preview — authentication isn't connected to a backend." />;
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

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Signing in…" : "Log in"}
      </button>

      <div className="flex justify-end text-sm">
        <a href="/register" className="text-slate-600 underline">
          Create account
        </a>
      </div>
    </form>
  );
}
