import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/ext-system'

export const extSystemRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.EXT_SYSTEM.LIST,
    component: () => import('@/views/dam/extSystem/ExtSystemListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_EXT_SYSTEM_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)',
    name: ROUTE.DAM.EXT_SYSTEM.DETAIL,
    component: () => import('@/views/dam/extSystem/ExtSystemDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_EXT_SYSTEM_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)/edit',
    name: ROUTE.DAM.EXT_SYSTEM.EDIT,
    component: () => import('@/views/dam/extSystem/ExtSystemEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_EXT_SYSTEM_VIEW, ACL.DAM_EXT_SYSTEM_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
