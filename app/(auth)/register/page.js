import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Create account", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="It takes a minute. We'll email you a link to confirm your address."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-lantern hover:underline">Sign in</Link></>}
    >
      <RegisterForm />
    </AuthCard>
  );
}
