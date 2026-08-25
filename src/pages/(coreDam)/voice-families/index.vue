<script setup lang="ts">
import VoiceFamilyListView from '@/domains/coreDam/voiceFamily/components/VoiceFamilyListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_TTS_VOICE_FAMILY_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.voiceFamily.list',
  },
})
</script>

<template>
  <VoiceFamilyListView />
</template>
