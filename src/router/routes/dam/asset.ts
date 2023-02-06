import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/asset'

export const assetRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.ASSET.LIST,
    component: () => import('@/views/dam/asset/list/AssetListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_VIEW],
      layout: 'AppLayoutMain',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.ASSET.DETAIL,
    component: () => import('@/views/dam/asset/detail/AssetDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_VIEW],
      layout: 'AppLayoutMain',
    },
  },
]
