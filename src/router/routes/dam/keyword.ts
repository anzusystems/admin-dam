import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/keyword'

export const keywordRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.KEYWORD.LIST,
    component: () => import('@/views/dam/keyword/KeywordListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_KEYWORD_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.KEYWORD.DETAIL,
    component: () => import('@/views/dam/keyword/KeywordDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_KEYWORD_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.KEYWORD.EDIT,
    component: () => import('@/views/dam/keyword/KeywordEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_KEYWORD_VIEW, ACL.DAM_KEYWORD_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
