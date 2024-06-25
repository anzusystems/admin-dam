import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const permissionGroupRoutes: RouteRecordRaw[] = [
  {
    path: '/permission-group',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.permissionGroup.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.COMMON.PERMISSION_GROUP.LIST,
        component: () => import('@/views/common/permissionGroup/PermissionGroupListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PERMISSION_GROUP_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.COMMON.PERMISSION_GROUP.EDIT,
        component: () => import('@/views/common/permissionGroup/PermissionGroupEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PERMISSION_GROUP_READ, ACL.DAM_PERMISSION_GROUP_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.permissionGroup.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.COMMON.PERMISSION_GROUP.DETAIL,
        component: () => import('@/views/common/permissionGroup/PermissionGroupDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PERMISSION_GROUP_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.permissionGroup.detail',
        },
      },
    ],
  },
]
