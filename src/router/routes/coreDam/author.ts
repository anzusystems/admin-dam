import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'

export const authorRoutes: RouteRecordRaw[] = [
  {
    path: '/author',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.author',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.AUTHOR.LIST,
        component: () => import('@/views/coreDam/author/AuthorListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_VIEW],
          layout: 'AppLayoutSidebar',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.AUTHOR.EDIT,
        component: () => import('@/views/coreDam/author/AuthorEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_VIEW, ACL.DAM_AUTHOR_UPDATE],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.AUTHOR.DETAIL,
        component: () => import('@/views/coreDam/author/AuthorDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_VIEW],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.detail',
        },
      },
    ],
  },
]
