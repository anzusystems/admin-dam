import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

export const assetRoutes = [
  {
    path: '/asset/list',
    name: ROUTE.DAM.ASSET.LIST,
    component: () => import('@/views/dam/asset/list/AssetListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_VIEW],
      layout: 'AppLayoutMain',
    },
  },
]
