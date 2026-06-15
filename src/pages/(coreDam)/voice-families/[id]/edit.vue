<script setup lang="ts">
import VoiceFamilyEditView from '@/domains/coreDam/voiceFamily/components/VoiceFamilyEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_TTS_VOICE_FAMILY_READ, ACL.DAM_TTS_VOICE_FAMILY_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.voiceFamily.edit',
  },
})
</script>

<template>
  <VoiceFamilyEditView />
</template>
