"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/auth";
import { safeNext } from "@/lib/utils/redirect";
import { useLogin } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FormError } from "./AuthCard";

export default function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) =>
    login.mutate(values, { onSuccess: () => { router.replace(next); router.refresh(); } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError>{login.error?.message}</FormError>
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-lantern hover:underline">Forgot password?</Link>
      </div>
      <Button type="submit" loading={login.isPending} className="w-full">Sign in</Button>
    </form>
  );
}
