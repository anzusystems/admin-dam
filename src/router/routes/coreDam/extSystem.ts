import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'

export const extSystemRoutes: RouteRecordRaw[] = [
  {
    path: '/ext-system',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.extSystem.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.EXT_SYSTEM.LIST,
        component: () => import('@/views/coreDam/extSystem/ExtSystemListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_EXT_SYSTEM_VIEW],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.DAM.EXT_SYSTEM.EDIT,
        component: () => import('@/views/coreDam/extSystem/ExtSystemEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_EXT_SYSTEM_VIEW, ACL.DAM_EXT_SYSTEM_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.extSystem.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.DAM.EXT_SYSTEM.DETAIL,
        component: () => import('@/views/coreDam/extSystem/ExtSystemDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_EXT_SYSTEM_VIEW],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.extSystem.detail',
        },
      },
    ],
  },
]
