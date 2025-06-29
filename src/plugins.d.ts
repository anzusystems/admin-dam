import type { MessageSchema } from '@/plugins/i18n'
import type { ObjectLeaves } from '@anzusystems/common-admin'
import 'vue-router'

import type { AclValue as CustomAclValue } from '@/composables/auth/auth'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    requiresAuth?: boolean
    requiredPermissions?: Array<CustomAclValue>
    breadcrumbT?: ObjectLeaves<MessageSchema> | string
  }
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ABtnPrimary: (typeof import('vuetify/components'))['VBtn']
    ABtnSecondary: (typeof import('vuetify/components'))['VBtn']
    ABtnTertiary: (typeof import('vuetify/components'))['VBtn']
    ABtnIcon: (typeof import('vuetify/components'))['VBtn']
    RouterLink: (typeof import('vue-router'))['RouterLink']
    RouterView: (typeof import('vue-router'))['RouterView']
    Acl: (typeof import('@anzusystems/common-admin'))['Acl']
  }
}

declare module '@vue/runtime-core' {
  interface AllowedComponentProps {
    dataCy?: string
  }
}

declare module '@anzusystems/common-admin' {
  export type AclValue = CustomAclValue
  export function can(acl: CustomAclValue, subject?: object): boolean
  export interface DefineLocaleMessage extends MessageSchema {}
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
