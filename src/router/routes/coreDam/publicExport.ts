import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const publicExportRoutes: RouteRecordRaw[] = [
  {
    path: '/public-export',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.publicExport.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.PUBLIC_EXPORT.LIST,
        component: () => import('@/views/coreDam/publicExport/PublicExportListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id(\\d+)/edit',
        name: ROUTE.DAM.PUBLIC_EXPORT.EDIT,
        component: () => import('@/views/coreDam/publicExport/PublicExportEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ, ACL.DAM_PUBLIC_EXPORT_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.publicExport.edit',
        },
      },
      {
        path: ':id(\\d+)',
        name: ROUTE.DAM.PUBLIC_EXPORT.DETAIL,
        component: () => import('@/views/coreDam/publicExport/PublicExportDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.publicExport.detail',
        },
      },
    ],
  },
]
