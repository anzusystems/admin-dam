import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const ttsAudioRoutes: RouteRecordRaw[] = [
  {
    path: '/tts-audio',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.ttsAudio.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.TTS_AUDIO.LIST,
        component: () => import('@/views/coreDam/ttsAudio/TtsAudioListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_TTS_AUDIO_READ],
          layout: 'AppLayoutDrawer',
        },
      },
    ],
  },
]
