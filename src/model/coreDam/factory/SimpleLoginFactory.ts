import type { SimpleLoginForm } from '@/types/coreDam/Auth'

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
