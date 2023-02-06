import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/anzu-user'

export const anzuUserRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.COMMON.ANZU_USER.LIST,
    component: () => import('@/views/common/anzuUser/AnzuUserListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_USER_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)',
    name: ROUTE.COMMON.ANZU_USER.DETAIL,
    component: () => import('@/views/common/anzuUser/AnzuUserDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_USER_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)/edit',
    name: ROUTE.COMMON.ANZU_USER.EDIT,
    component: () => import('@/views/common/anzuUser/AnzuUserEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_USER_VIEW, ACL.DAM_USER_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]