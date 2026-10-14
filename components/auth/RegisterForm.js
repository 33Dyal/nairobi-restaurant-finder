"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema } from "@/lib/validation/auth";
import { useRegister } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FormError, FormNotice } from "./AuthCard";

export default function RegisterForm() {
  const registerUser = useRegister();
  const { register, handleSubmit, getValues, formState: { errors } } = useForm({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = (values) => registerUser.mutate({ name: values.name, email: values.email, password: values.password });

  if (registerUser.isSuccess) {
    return (
      <div className="space-y-3">
        <FormNotice>We&apos;ve sent a verification link to {getValues("email")}. Open it to confirm your account, then sign in.</FormNotice>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-ink-soft">Development: the verification link is also printed in the terminal running <code>npm run dev</code>.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError>{registerUser.error?.message}</FormError>
      <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Input label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message} {...register("password")} />
      <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" loading={registerUser.isPending} className="w-full">Create account</Button>
    </form>
  );
}
