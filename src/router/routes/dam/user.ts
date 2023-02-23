import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/user'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.USER.LIST,
    component: () => import('@/views/dam/user/UserListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_USER_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)',
    name: ROUTE.DAM.USER.DETAIL,
    component: () => import('@/views/dam/user/UserDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_USER_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)/edit',
    name: ROUTE.DAM.USER.EDIT,
    component: () => import('@/views/dam/user/UserEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_USER_VIEW, ACL.DAM_USER_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
