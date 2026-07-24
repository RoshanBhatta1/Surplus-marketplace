"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { registerUser } from "@/app/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: "INDIVIDUAL" },
  });

  const accountType = watch("accountType");

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const result = await registerUser(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSubmitted(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a verification link to your email address. Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Create your account</h1>

      <div className="flex gap-2 rounded-md border border-slate-200 p-1 text-sm">
        <label className="flex-1">
          <input type="radio" value="INDIVIDUAL" {...register("accountType")} className="peer sr-only" />
          <span className="block cursor-pointer rounded px-3 py-2 text-center peer-checked:bg-slate-900 peer-checked:text-white">
            Individual
          </span>
        </label>
        <label className="flex-1">
          <input type="radio" value="BUSINESS" {...register("accountType")} className="peer sr-only" />
          <span className="block cursor-pointer rounded px-3 py-2 text-center peer-checked:bg-slate-900 peer-checked:text-white">
            Business / contractor
          </span>
        </label>
      </div>

      <Field label="Full name" error={errors.name?.message}>
        <input {...register("name")} className="input" />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" {...register("email")} className="input" />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input type="password" {...register("password")} className="input" />
      </Field>
      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input type="tel" {...register("phone")} className="input" />
      </Field>

      {accountType === "BUSINESS" && (
        <>
          <Field label="Business name" error={errors.businessName?.message}>
            <input {...register("businessName")} className="input" />
          </Field>
          <Field label="Business number" error={errors.businessNumber?.message}>
            <input {...register("businessNumber")} className="input" />
          </Field>
        </>
      )}

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-slate-900 underline">
          Log in
        </a>
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="text-red-600">{error}</span>}
    </label>
  );
}
