"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { useForgotPassword } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FormError, FormNotice } from "./AuthCard";

export default function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  if (forgot.isSuccess) return <FormNotice>{forgot.data.message}</FormNotice>;

  return (
    <form onSubmit={handleSubmit((v) => forgot.mutate(v))} noValidate className="space-y-4">
      <FormError>{forgot.error?.message}</FormError>
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" loading={forgot.isPending} className="w-full">Send reset link</Button>
    </form>
  );
}
