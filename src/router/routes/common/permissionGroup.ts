import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/permission-group'

export const permissionGroupRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.COMMON.PERMISSION_GROUP.LIST,
    component: () => import('@/views/common/permissionGroup/PermissionGroupListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PERMISSION_GROUP_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)',
    name: ROUTE.COMMON.PERMISSION_GROUP.DETAIL,
    component: () => import('@/views/common/permissionGroup/PermissionGroupDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PERMISSION_GROUP_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)/edit',
    name: ROUTE.COMMON.PERMISSION_GROUP.EDIT,
    component: () => import('@/views/common/permissionGroup/PermissionGroupEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PERMISSION_GROUP_VIEW, ACL.DAM_PERMISSION_GROUP_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
