import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

export const externalProviderRoutes = [
  {
    path: '/external-provider/:provider/list',
    name: ROUTE.DAM.EXTERNAL_PROVIDER.LIST,
    component: () => import('@/views/dam/externalProviderAsset/ExternalProviderAssetListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_VIEW],
      layout: 'AppLayoutMain',
    },
  },
]
