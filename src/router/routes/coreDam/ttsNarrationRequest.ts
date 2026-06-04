import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const ttsNarrationRequestRoutes: RouteRecordRaw[] = [
  {
    path: '/tts-narration-request',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.ttsNarrationRequest.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.TTS_NARRATION_REQUEST.LIST,
        component: () => import('@/views/coreDam/ttsNarrationRequest/TtsNarrationRequestListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_TTS_NARRATION_REQUEST_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.TTS_NARRATION_REQUEST.DETAIL,
        component: () => import('@/views/coreDam/ttsNarrationRequest/TtsNarrationRequestDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_TTS_NARRATION_REQUEST_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.ttsNarrationRequest.detail',
        },
      },
    ],
  },
]
