// eslint-disable-next-line
import type { DefineLocaleMessage } from 'vue-i18n'
import type { MessageSchema } from '@/plugins/i18n'
import 'vue-router'
import type { AclValue as CustomAclValue } from '@/types/Permission'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    requiresAuth?: boolean
    requiredPermissions?: Array<CustomAclValue>
  }
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    RouterLink: typeof import('vue-router')['RouterLink']
    RouterView: typeof import('vue-router')['RouterView']
    Notifications: any // todo
    Acl: typeof import('@anzusystems/common-admin')['Acl']
  }
}

declare module '@anzusystems/common-admin' {
  export type AclValue = CustomAclValue
  export function can(acl: CustomAclValue, subject?: object): boolean
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
