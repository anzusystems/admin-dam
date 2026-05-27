<script setup lang="ts">
import VideoShowEpisodeEditView from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
