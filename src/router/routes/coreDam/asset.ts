import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const assetRoutes: RouteRecordRaw[] = [
  {
    path: '/asset',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.ASSET.LIST,
        component: () => import('@/views/coreDam/asset/list/AssetListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_READ],
          layout: 'AppLayoutMain',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.ASSET.DETAIL,
        component: () => import('@/views/coreDam/asset/detail/AssetDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_READ],
          layout: 'AppLayoutMain',
        },
      },
    ],
  },
]
