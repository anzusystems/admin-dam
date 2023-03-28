import HomepageView from '@/views/system/HomepageView.vue'
import { ROUTE } from '@/router/routes'
import { AUnauthorizedView } from '@anzusystems/common-admin'

export const systemRoutes = [
  {
    path: '/settings',
    component: () => import('@/views/system/settings/SettingsView.vue'),
    name: ROUTE.SYSTEM.SETTINGS,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
    },
  },
  {
    path: '/login',
    component: () => import('@/views/system/LoginView.vue'),
    name: ROUTE.SYSTEM.LOGIN,
    meta: {
      requiresAuth: false,
      requiredPermissions: [],
      layout: 'AppLayoutFullscreen',
    },
  },
  {
    path: '/close-page',
    component: () => import('@/views/system/ClosePageView.vue'),
    name: ROUTE.SYSTEM.CLOSE_PAGE,
    meta: {
      requiresAuth: false,
      requiredPermissions: [],
      layout: 'AppLayoutFullscreen',
    },
  },
  {
    path: '/logout',
    component: () => import('@/views/system/LogoutView.vue'),
    name: ROUTE.SYSTEM.LOGOUT,
    meta: {
      requiresAuth: false,
      requiredPermissions: [],
      layout: 'AppLayoutFullscreen',
    },
  },
  {
    path: '/unauthorized',
    component: AUnauthorizedView,
    props: { returnRouteName: ROUTE.SYSTEM.LOGIN },
    name: ROUTE.SYSTEM.UNAUTHORIZED,
    meta: {
      requiresAuth: false,
      requiredPermissions: [],
      layout: 'AppLayoutFullscreen',
    },
  },
]
