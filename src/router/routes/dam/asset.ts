import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/asset'

export const assetRoutes: RouteRecordRaw[] = [
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
