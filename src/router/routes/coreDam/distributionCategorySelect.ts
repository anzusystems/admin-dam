import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/distribution-category/select'

export const distributionCategorySelectRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST,
    component: () => import('@/views/coreDam/distributionCategorySelect/DistributionCategorySelectListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL,
    component: () => import('@/views/coreDam/distributionCategorySelect/DistributionCategorySelectDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT,
    component: () => import('@/views/coreDam/distributionCategorySelect/DistributionCategorySelectEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW, ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
