"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "@/lib/api-client";

export const ME_KEY = ["me"];

export function useCurrentUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return (await apiFetch("/api/auth/me")).user;
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values) => apiFetch("/api/auth/login", { method: "POST", body: values }),
    onSuccess: (data) => qc.setQueryData(ME_KEY, data.user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
    },
  });
}

export const useRegister = () => useMutation({ mutationFn: (v) => apiFetch("/api/auth/register", { method: "POST", body: v }) });
export const useForgotPassword = () => useMutation({ mutationFn: (v) => apiFetch("/api/auth/forgot-password", { method: "POST", body: v }) });
export const useResetPassword = () => useMutation({ mutationFn: (v) => apiFetch("/api/auth/reset-password", { method: "POST", body: v }) });
export const useResendVerification = () => useMutation({ mutationFn: (v) => apiFetch("/api/auth/resend-verification", { method: "POST", body: v }) });
