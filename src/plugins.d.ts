import type { ObjectLeaves } from '@anzusystems/common-admin'

import type { AclValue as CustomAclValue } from '@/domains/system/auth/auth'
import 'vue-router'

import type { MessageSchema } from '@/plugins/i18n'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    requiresAuth?: boolean
    requiredPermissions?: Array<CustomAclValue>
    /**
     * The system whose superadmin this route is for. Logs are gated on the role, not on a
     * permission, and so are, for now, the pages the backend refuses to anyone else (each says
     * why). `definePage` needs a literal, so the value is repeated here rather than read
     * from `LOG_SYSTEM`; a route test pins the two together.
     */
    superAdminOf?: string
    breadcrumbT?: ObjectLeaves<MessageSchema> | string
  }
}

declare module '@anzusystems/common-admin' {
  // `<Acl :permission>` takes these values.
  interface AclRegistry {
    acl: CustomAclValue
  }
  export interface DefineLocaleMessage extends MessageSchema {}

  interface AssetFileProperties {
    ttsAudio: boolean
  }
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
