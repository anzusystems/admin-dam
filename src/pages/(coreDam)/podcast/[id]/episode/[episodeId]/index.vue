<script setup lang="ts">
import PodcastEpisodeDetailView from '@/views/coreDam/podcastEpisode/PodcastEpisodeDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PODCAST_EPISODE_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.podcastEpisode.detail',
  },
})
</script>

<template>
  <PodcastEpisodeDetailView />
</template>
