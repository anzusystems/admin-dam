import HomepageView from '@/views/system/HomepageView.vue'
import { ROUTE } from '@/router/routes'

export const systemRoutes = [
  {
    path: '/',
    component: HomepageView,
    name: ROUTE.SYSTEM.HOMEPAGE,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutFullscreen',
    },
  },
  {
    path: '/settings',
    component: () => import('@/views/system/settings/SettingsView.vue'),
    name: ROUTE.SYSTEM.SETTINGS,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: '/beta',
    component: () => import('@/views/system/beta/BetaView.vue'),
    name: ROUTE.SYSTEM.BETA,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  // {
  //   path: '/test-grid2',
  //   component: () => import('@/views/system/beta/grid2/Test2View.vue'),
  //   name: 'grid2',
  //   meta: {
  //     requiresAuth: false,
  //     requiredPermissions: [],
  //     layout: 'AppLayoutBlank',
  //   },
  // },
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
    component: () => import('@/views/system/UnauthorizedView.vue'),
    name: ROUTE.SYSTEM.UNAUTHORIZED,
    meta: {
      requiresAuth: false,
      requiredPermissions: [],
      layout: 'AppLayoutFullscreen',
    },
  },
]
