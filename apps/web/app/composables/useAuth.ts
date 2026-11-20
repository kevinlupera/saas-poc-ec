// Only call inside .client components: the static site never resolves private sessions.
export function useAuth() {
  return useNuxtApp().$auth
}
