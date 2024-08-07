import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const keywordRoutes: RouteRecordRaw[] = [
  {
    path: '/keyword',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.keyword.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.KEYWORD.LIST,
        component: () => import('@/views/coreDam/keyword/KeywordListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_KEYWORD_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.KEYWORD.EDIT,
        component: () => import('@/views/coreDam/keyword/KeywordEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_KEYWORD_READ, ACL.DAM_KEYWORD_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.keyword.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.KEYWORD.DETAIL,
        component: () => import('@/views/coreDam/keyword/KeywordDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_KEYWORD_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.keyword.detail',
        },
      },
    ],
  },
]
