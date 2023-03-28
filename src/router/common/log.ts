import ListView from '@/views/common/log/LogListView.vue'
import DetailView from '@/views/common/log/LogDetailView.vue'
import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/common/log'

export const commonLogRoutes = [
  {
    path: PATH + '/:system/:type/:id',
    name: ROUTE.COMMON.LOG.DETAIL,
    component: DetailView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_LOG_UI],
      layout: 'AppLayoutDrawer',
    },
  },
  {
    path: PATH,
    name: ROUTE.COMMON.LOG.LIST,
    component: ListView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_LOG_UI],
      layout: 'AppLayoutDrawer',
    },
  },
]
