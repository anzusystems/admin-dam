<script setup lang="ts">
import VoiceFamilyDetailView from '@/domains/coreDam/voiceFamily/components/VoiceFamilyDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_TTS_VOICE_FAMILY_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.voiceFamily.detail',
  },
})
</script>

<template>
  <VoiceFamilyDetailView />
</template>
