"use client";

import { useRouter } from "next/navigation";
import { useLogout, useResendVerification } from "@/hooks/useAuth";
import { toast } from "@/stores/toast";
import Button from "@/components/ui/Button";

export function ResendVerification({ email }) {
  const resend = useResendVerification();
  return (
    <Button
      variant="secondary"
      loading={resend.isPending}
      onClick={() => resend.mutate({ email }, { onSuccess: (d) => toast.success(d.message), onError: (e) => toast.error(e.message) })}
    >
      Resend verification email
    </Button>
  );
}

export function SignOutButton() {
  const logout = useLogout();
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      loading={logout.isPending}
      onClick={() => logout.mutate(undefined, { onSuccess: () => { toast.success("You've been signed out."); router.replace("/"); router.refresh(); } })}
    >
      Sign out
    </Button>
  );
}
