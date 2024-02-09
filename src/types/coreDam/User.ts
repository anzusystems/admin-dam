import type { AnzuUser, DamUserUpdateDto, IntegerId } from '@anzusystems/common-admin'

export interface UserMinimal {
  id: IntegerId
  person: {
    firstName: string
    lastName: string
    fullName: string
  }
  avatar: {
    color: string
    text: string
  }
  email: string
}

export interface User extends Omit<AnzuUser, 'id'>, DamUserUpdateDto {}
