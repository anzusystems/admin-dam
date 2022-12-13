import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'

const PATH = '/asset-licence'

export const assetLicenceRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.ASSET_LICENCE.LIST,
    component: () => import('@/views/dam/assetLicence/AssetLicenceListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_LICENCE_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)',
    name: ROUTE.DAM.ASSET_LICENCE.DETAIL,
    component: () => import('@/views/dam/assetLicence/AssetLicenceDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_LICENCE_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id(\\d+)/edit',
    name: ROUTE.DAM.ASSET_LICENCE.EDIT,
    component: () => import('@/views/dam/assetLicence/AssetLicenceEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_ASSET_LICENCE_VIEW, ACL.DAM_ASSET_LICENCE_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
