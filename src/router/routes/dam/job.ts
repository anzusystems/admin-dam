import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/job'

export const jobRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.JOB.LIST,
    component: () => import('@/views/dam/job/JobListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_JOB_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.JOB.DETAIL,
    component: () => import('@/views/dam/job/JobDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_JOB_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
]
