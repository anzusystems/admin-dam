import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const assetLicenceRoutes: RouteRecordRaw[] = [
  {
    path: '/asset-licence',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.assetLicence.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.ASSET_LICENCE.LIST,
        component: () => import('@/views/coreDam/assetLicence/AssetLicenceListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_LICENCE_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.DAM.ASSET_LICENCE.EDIT,
        component: () => import('@/views/coreDam/assetLicence/AssetLicenceEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_LICENCE_READ, ACL.DAM_ASSET_LICENCE_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.assetLicence.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.DAM.ASSET_LICENCE.DETAIL,
        component: () => import('@/views/coreDam/assetLicence/AssetLicenceDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_LICENCE_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.assetLicence.detail',
        },
      },
    ],
  },
]
