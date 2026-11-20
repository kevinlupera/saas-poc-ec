import { authErrorMessage, type AuthError } from '../utils/auth'

// Shared request lifecycle, not a second identity/session store.
export function useAuthAction() {
  const pending = ref(false)
  const error = ref('')
  const errorCode = ref('')
  async function run(action: () => Promise<void>) {
    if (pending.value) return
    pending.value = true
    error.value = ''
    errorCode.value = ''
    try {
      await action()
    } catch (cause) {
      const failure = cause && typeof cause === 'object' ? cause as AuthError : undefined
      errorCode.value = typeof failure?.code === 'string' ? failure.code : ''
      error.value = authErrorMessage(failure)
    } finally {
      pending.value = false
    }
  }
  return { pending, error, errorCode, run }
}
