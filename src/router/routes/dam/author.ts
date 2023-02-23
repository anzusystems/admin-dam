import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/author'

export const authorRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.AUTHOR.LIST,
    component: () => import('@/views/dam/author/AuthorListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_AUTHOR_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.AUTHOR.DETAIL,
    component: () => import('@/views/dam/author/AuthorDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_AUTHOR_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.AUTHOR.EDIT,
    component: () => import('@/views/dam/author/AuthorEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_AUTHOR_VIEW, ACL.DAM_AUTHOR_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
