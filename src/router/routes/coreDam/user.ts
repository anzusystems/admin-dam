import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/user',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.user.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.USER.LIST,
        component: () => import('@/views/coreDam/user/UserListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.DAM.USER.EDIT,
        component: () => import('@/views/coreDam/user/UserEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_READ, ACL.DAM_USER_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.user.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.DAM.USER.DETAIL,
        component: () => import('@/views/coreDam/user/UserDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.user.detail',
        },
      },
    ],
  },
]
