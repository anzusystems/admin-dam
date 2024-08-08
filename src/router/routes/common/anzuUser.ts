import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const anzuUserRoutes: RouteRecordRaw[] = [
  {
    path: '/anzu-user',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.anzuUser.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.COMMON.ANZU_USER.LIST,
        component: () => import('@/views/common/anzuUser/AnzuUserListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.COMMON.ANZU_USER.EDIT,
        component: () => import('@/views/common/anzuUser/AnzuUserEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_READ, ACL.DAM_USER_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.anzuUser.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.COMMON.ANZU_USER.DETAIL,
        component: () => import('@/views/common/anzuUser/AnzuUserDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.anzuUser.detail',
        },
      },
    ],
  },
]
