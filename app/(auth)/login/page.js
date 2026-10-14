import Link from "next/link";
import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      description="Save favorites, write reviews and manage your restaurant listing."
      footer={<>New here? <Link href="/register" className="font-medium text-lantern hover:underline">Create an account</Link></>}
    >
      <Suspense><LoginForm /></Suspense>
    </AuthCard>
  );
}
