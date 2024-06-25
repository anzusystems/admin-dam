import ListView from '@/views/common/log/LogListView.vue'
import DetailView from '@/views/common/log/LogDetailView.vue'
import { ROUTE } from '@/router/routes'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const commonLogRoutes = [
  {
    path: '/log',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.log.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.COMMON.LOG.LIST,
        component: ListView,
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_LOG_UI],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':system/:type/:id',
        name: ROUTE.COMMON.LOG.DETAIL,
        component: DetailView,
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_LOG_UI],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.log.detail',
        },
      },
    ],
  },
]
