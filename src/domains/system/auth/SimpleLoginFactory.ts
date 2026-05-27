import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'

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
