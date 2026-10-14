"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema } from "@/lib/validation/auth";
import { useResetPassword } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FormError, FormNotice } from "./AuthCard";

export default function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const reset = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(resetPasswordFormSchema) });

  if (!token) {
    return <FormError>This reset link is incomplete. <Link href="/forgot-password" className="underline">Request a new one</Link>.</FormError>;
  }
  if (reset.isSuccess) {
    return (
      <div className="space-y-4">
        <FormNotice>{reset.data.message}</FormNotice>
        <Link href="/login" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-jacaranda-600 text-sm font-semibold text-black hover:bg-jacaranda-700">Go to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(({ password }) => reset.mutate({ token, password }))} noValidate className="space-y-4">
      <FormError>{reset.error?.message}</FormError>
      <Input label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message} {...register("password")} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" loading={reset.isPending} className="w-full">Update password</Button>
    </form>
  );
}
