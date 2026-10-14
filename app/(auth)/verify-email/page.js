import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import VerifyEmail from "@/components/auth/VerifyEmail";

export const metadata = { title: "Verify your email", robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Email verification">
      <Suspense><VerifyEmail /></Suspense>
    </AuthCard>
  );
}
