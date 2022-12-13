import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/permission-group'

export const permissionGroupRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.PERMISSION_GROUP.LIST,
    component: () => import('@/views/dam/permissionGroup/PermissionGroupListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PERMISSION_GROUP_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)',
    name: ROUTE.DAM.PERMISSION_GROUP.DETAIL,
    component: () => import('@/views/dam/permissionGroup/PermissionGroupDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PERMISSION_GROUP_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)/edit',
    name: ROUTE.DAM.PERMISSION_GROUP.EDIT,
    component: () => import('@/views/dam/permissionGroup/PermissionGroupEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PERMISSION_GROUP_VIEW, ACL.DAM_PERMISSION_GROUP_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
