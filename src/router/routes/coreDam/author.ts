import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const authorRoutes: RouteRecordRaw[] = [
  {
    path: '/author',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.author.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.AUTHOR.LIST,
        component: () => import('@/views/coreDam/author/AuthorListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.AUTHOR.EDIT,
        component: () => import('@/views/coreDam/author/AuthorEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_READ, ACL.DAM_AUTHOR_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.author.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.AUTHOR.DETAIL,
        component: () => import('@/views/coreDam/author/AuthorDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.author.detail',
        },
      },
    ],
  },
]
