import type { MessageSchema } from '@/plugins/i18n'
import type { ObjectLeaves } from '@anzusystems/common-admin'
import 'vue-router'

import type { AclValue as CustomAclValue } from '@/domains/system/auth/auth'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    requiresAuth?: boolean
    requiredPermissions?: Array<CustomAclValue>
    /**
     * The system whose superadmin this route is for. Logs are gated on the role, not on a
     * permission. `definePage` needs a literal, so the value is repeated here rather than read
     * from `LOG_SYSTEM`; a route test pins the two together.
     */
    superAdminOf?: string
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

  interface AssetFileProperties {
    ttsAudio: boolean
  }
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
