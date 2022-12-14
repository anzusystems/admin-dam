import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/distribution-category/select'

export const distributionCategorySelectRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST,
    component: () => import('@/views/dam/distributionCategorySelect/DistributionCategorySelectListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL,
    component: () => import('@/views/dam/distributionCategorySelect/DistributionCategorySelectDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT,
    component: () => import('@/views/dam/distributionCategorySelect/DistributionCategorySelectEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW, ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
