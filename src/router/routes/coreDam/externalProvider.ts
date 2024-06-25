import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { ACL } from '@/composables/auth/auth'

export const externalProviderRoutes: RouteRecordRaw[] = [
  {
    path: '/external-provider/:provider',
    name: ROUTE.DAM.EXTERNAL_PROVIDER.LIST,
    component: () => import('@/views/coreDam/externalProviderAsset/ExternalProviderAssetListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS],
      layout: 'AppLayoutMain',
    },
  },
]
