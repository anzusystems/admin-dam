import type { SimpleLoginForm } from '@/types/dam/Auth'

export function useSimpleLoginFactory() {
  const createDefault = (): SimpleLoginForm => {
    return {
      username: '',
      password: '',
    }
  }

  return {
    createDefault,
  }
}
