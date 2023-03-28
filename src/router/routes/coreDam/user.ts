import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/user',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.user',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.USER.LIST,
        component: () => import('@/views/coreDam/user/UserListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_VIEW],
          layout: 'AppLayoutSidebar',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.DAM.USER.EDIT,
        component: () => import('@/views/coreDam/user/UserEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_VIEW, ACL.DAM_USER_UPDATE],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.DAM.USER.DETAIL,
        component: () => import('@/views/coreDam/user/UserDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_USER_VIEW],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.detail',
        },
      },
    ],
  },
]
