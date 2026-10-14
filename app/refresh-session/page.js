import { Suspense } from "react";
import SessionRefresh from "@/components/auth/SessionRefresh";

export const metadata = { title: "Restoring your session", robots: { index: false } };

export default function RefreshSessionPage() {
  return <Suspense><SessionRefresh /></Suspense>;
}
