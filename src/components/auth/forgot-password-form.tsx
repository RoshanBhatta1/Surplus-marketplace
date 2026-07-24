"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordResetSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/app/actions/auth";
import type { z } from "zod";

type Input = z.infer<typeof requestPasswordResetSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({ resolver: zodResolver(requestPasswordResetSchema) });

  if (sent) {
    return (
      <p className="text-sm text-slate-600">
        If an account exists for that email, we sent a password reset link.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await requestPasswordReset(values);
        setSent(true);
      })}
      className="flex flex-col gap-4"
    >
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input type="email" {...register("email")} className="input" />
        {errors.email && <span className="text-red-600">{errors.email.message}</span>}
      </label>
      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
