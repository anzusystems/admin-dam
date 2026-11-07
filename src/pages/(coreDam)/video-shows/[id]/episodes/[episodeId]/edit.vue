<script setup lang="ts">
import VideoShowEpisodeEditView from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/video-shows/:id([0-9a-f-]{36})/episodes/:episodeId([0-9a-f-]{36})/edit',
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
