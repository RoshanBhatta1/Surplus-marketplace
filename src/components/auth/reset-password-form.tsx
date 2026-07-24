"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { resetPassword } from "@/app/actions/auth";
import type { z } from "zod";

type Input = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setServerError(null);
        const result = await resetPassword(values);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        router.push("/login");
      })}
      className="flex flex-col gap-4"
    >
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <input type="hidden" {...register("token")} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">New password</span>
        <input type="password" {...register("password")} className="input" />
        {errors.password && <span className="text-red-600">{errors.password.message}</span>}
      </label>
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
