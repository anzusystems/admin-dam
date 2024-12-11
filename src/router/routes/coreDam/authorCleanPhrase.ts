import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const authorCleanPhraseRoutes: RouteRecordRaw[] = [
  {
    path: '/author-clean-phrase',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.AUTHOR_CLEAN_PHRASE.LIST,
        component: () => import('@/views/coreDam/authorCleanPhrase/AuthorCleanPhraseListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.AUTHOR_CLEAN_PHRASE.EDIT,
        component: () => import('@/views/coreDam/authorCleanPhrase/AuthorCleanPhraseEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ, ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.AUTHOR_CLEAN_PHRASE.DETAIL,
        component: () => import('@/views/coreDam/authorCleanPhrase/AuthorCleanPhraseDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.detail',
        },
      },
    ],
  },
]
