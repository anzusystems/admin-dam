import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'

export function useSimpleLoginFactory() {
  const createDefault = (): SimpleLoginForm => ({
    username: '',
    password: '',
  })

  return {
    createDefault,
  }
}
