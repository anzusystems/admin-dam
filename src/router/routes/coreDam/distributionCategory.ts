import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'

export const distributionCategoryRoutes: RouteRecordRaw[] = [
  {
    path: '/distribution-category',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.distributionCategory.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST,
        component: () => import('@/views/coreDam/distributionCategory/DistributionCategoryListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_VIEW],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT,
        component: () => import('@/views/coreDam/distributionCategory/DistributionCategoryEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_VIEW, ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.distributionCategory.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL,
        component: () => import('@/views/coreDam/distributionCategory/DistributionCategoryDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_VIEW],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.distributionCategory.detail',
        },
      },
    ],
  },
]
