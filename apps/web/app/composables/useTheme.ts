export type ThemeMode = 'light' | 'dark'

export function useTheme() {
  const theme = useState<ThemeMode>('app-theme', () => 'light')

  const isDark = computed(() => theme.value === 'dark')

  function applyTheme(newTheme: ThemeMode) {
    theme.value = newTheme
    if (import.meta.client) {
      const root = document.documentElement
      root.classList.toggle('dark', newTheme === 'dark')
      root.style.colorScheme = newTheme
      try {
        localStorage.setItem('theme', newTheme)
      } catch {
        // localStorage not available
      }
    }
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function initTheme() {
    if (import.meta.client) {
      // The head script already applied the theme before the first paint.
      // Sync after mounting so SSR markup and Vue's initial hydration agree.
      theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
  }

  return {
    theme,
    isDark,
    toggleTheme,
    applyTheme,
    initTheme,
  }
}
