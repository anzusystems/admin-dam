<script setup lang="ts">
import VideoShowEpisodeEditView from '@/views/coreDam/videoShowEpisode/VideoShowEpisodeEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_VIDEO_SHOW_EPISODE_READ, ACL.DAM_VIDEO_SHOW_EPISODE_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.videoShowEpisode.edit',
  },
})
</script>

<template>
  <VideoShowEpisodeEditView />
</template>
