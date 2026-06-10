import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const voiceFamilyRoutes: RouteRecordRaw[] = [
  {
    path: '/voice-family',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.voiceFamily.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.VOICE_FAMILY.LIST,
        component: () => import('@/views/coreDam/voiceFamily/VoiceFamilyListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_TTS_VOICE_FAMILY_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.VOICE_FAMILY.EDIT,
        component: () => import('@/views/coreDam/voiceFamily/VoiceFamilyEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_TTS_VOICE_FAMILY_READ, ACL.DAM_TTS_VOICE_FAMILY_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.voiceFamily.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.VOICE_FAMILY.DETAIL,
        component: () => import('@/views/coreDam/voiceFamily/VoiceFamilyDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_TTS_VOICE_FAMILY_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.voiceFamily.detail',
        },
      },
    ],
  },
]
