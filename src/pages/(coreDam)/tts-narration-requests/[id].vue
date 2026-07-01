<script setup lang="ts">
import TtsNarrationRequestDetailView from '@/domains/coreDam/ttsNarrationRequest/components/TtsNarrationRequestDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_TTS_NARRATION_REQUEST_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.ttsNarrationRequest.detail',
  },
})
</script>

<template>
  <TtsNarrationRequestDetailView />
</template>
