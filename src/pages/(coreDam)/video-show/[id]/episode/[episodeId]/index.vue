<script setup lang="ts">
import VideoShowEpisodeDetailView from '@/views/coreDam/videoShowEpisode/VideoShowEpisodeDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_VIDEO_SHOW_EPISODE_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.videoShowEpisode.detail',
  },
})
</script>

<template>
  <VideoShowEpisodeDetailView />
</template>
