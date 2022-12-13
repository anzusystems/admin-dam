import type { SimpleLoginForm } from '@/types/dam/Auth'

export function useSimpleLoginFactory() {
  const createDefault = (): SimpleLoginForm => {
    return {
      username: 'dam_admin@anzusystems.dev',
      password: 'admin',
    }
  }

  return {
    createDefault,
  }
}
