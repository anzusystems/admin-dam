import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const distributionCategorySelectRoutes: RouteRecordRaw[] = [
  {
    path: '/distribution-category-select',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.distributionCategorySelect.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST,
        component: () => import('@/views/coreDam/distributionCategorySelect/DistributionCategorySelectListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT,
        component: () => import('@/views/coreDam/distributionCategorySelect/DistributionCategorySelectEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ, ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.distributionCategorySelect.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL,
        component: () => import('@/views/coreDam/distributionCategorySelect/DistributionCategorySelectDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.distributionCategorySelect.detail',
        },
      },
    ],
  },
]
