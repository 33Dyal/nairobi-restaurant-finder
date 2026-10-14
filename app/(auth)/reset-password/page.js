import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" description="You'll be signed out on all devices once it's changed.">
      <Suspense><ResetPasswordForm /></Suspense>
    </AuthCard>
  );
}
