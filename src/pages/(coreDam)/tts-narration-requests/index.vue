<script setup lang="ts">
import TtsNarrationRequestListView from '@/domains/coreDam/ttsNarrationRequest/components/TtsNarrationRequestListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_TTS_NARRATION_REQUEST_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.ttsNarrationRequest.list',
  },
})
</script>

<template>
  <TtsNarrationRequestListView />
</template>
