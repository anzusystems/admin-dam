import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const assetLicenceGroupRoutes: RouteRecordRaw[] = [
  {
    path: '/asset-licence-group',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.ASSET_LICENCE_GROUP.LIST,
        component: () => import('@/views/coreDam/assetLicenceGroup/AssetLicenceGroupListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.DAM.ASSET_LICENCE_GROUP.EDIT,
        component: () => import('@/views/coreDam/assetLicenceGroup/AssetLicenceGroupEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_READ, ACL.DAM_ASSET_LICENCE_GROUP_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.DAM.ASSET_LICENCE_GROUP.DETAIL,
        component: () => import('@/views/coreDam/assetLicenceGroup/AssetLicenceGroupDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.detail',
        },
      },
    ],
  },
]
