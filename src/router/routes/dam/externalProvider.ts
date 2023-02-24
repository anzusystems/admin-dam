import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

export const externalProviderRoutes: RouteRecordRaw[] = [
  {
    path: '/external-provider/:provider/list',
    name: ROUTE.DAM.EXTERNAL_PROVIDER.LIST,
    component: () => import('@/views/dam/externalProviderAsset/ExternalProviderAssetListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS],
      layout: 'AppLayoutMain',
    },
  },
]
