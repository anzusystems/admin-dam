<script setup lang="ts">
import PodcastEpisodeEditView from '@/views/coreDam/podcastEpisode/PodcastEpisodeEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PODCAST_EPISODE_READ, ACL.DAM_PODCAST_EPISODE_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'common.system.breadcrumb.edit',
  },
})
</script>

<template>
  <PodcastEpisodeEditView />
</template>
