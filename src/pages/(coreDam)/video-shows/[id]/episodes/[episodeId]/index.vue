<script setup lang="ts">
import VideoShowEpisodeDetailView from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
