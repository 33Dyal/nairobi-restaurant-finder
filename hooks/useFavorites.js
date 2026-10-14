"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useAuth";

export const FAVORITES_KEY = ["favorites"];

export function useFavorites() {
  const qc = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();

  // Only fetched once we know someone is signed in. This runs again
  // automatically after login, and logout clears the cache.
  const { data } = useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: () => apiFetch("/api/favorites"),
    enabled: !!user,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, saved }) => apiFetch(`/api/favorites/${id}`, { method: saved ? "DELETE" : "PUT" }),
    onMutate: async ({ id, saved }) => {
      await qc.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = qc.getQueryData(FAVORITES_KEY);
      qc.setQueryData(FAVORITES_KEY, (old) => {
        const ids = old?.ids ?? [];
        return { ids: saved ? ids.filter((x) => x !== id) : [...new Set([...ids, id])] };
      });
      return { previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(FAVORITES_KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: FAVORITES_KEY }),
  });

  return {
    signedIn: isLoading ? null : !!user, // null while we're still finding out
    isSaved: (id) => data?.ids?.includes(id) ?? false,
    toggle: (id, options) => mutation.mutate({ id, saved: data?.ids?.includes(id) ?? false }, options),
  };
}