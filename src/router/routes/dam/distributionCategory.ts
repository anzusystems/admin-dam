import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/distribution-category'

export const distributionCategoryRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST,
    component: () => import('@/views/coreDam/distributionCategory/DistributionCategoryListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL,
    component: () => import('@/views/coreDam/distributionCategory/DistributionCategoryDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT,
    component: () => import('@/views/coreDam/distributionCategory/DistributionCategoryEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_VIEW, ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
