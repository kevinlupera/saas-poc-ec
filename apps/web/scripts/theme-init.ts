// Inlined synchronously in <head>, before styles and Vue hydration (also on static pages).
export const themeInitScript = `
(() => {
  let savedTheme
  try {
    savedTheme = localStorage.getItem('theme')
  } catch {
    // Storage can be blocked; the system preference still works.
  }

  const isDark = savedTheme === 'dark'
    || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
})()
`
