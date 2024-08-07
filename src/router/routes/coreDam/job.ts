import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const jobRoutes: RouteRecordRaw[] = [
  {
    path: '/job',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.job.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.JOB.LIST,
        component: () => import('@/views/coreDam/job/JobListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_JOB_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.JOB.DETAIL,
        component: () => import('@/views/coreDam/job/JobDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_JOB_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.job.detail',
        },
      },
    ],
  },
]
