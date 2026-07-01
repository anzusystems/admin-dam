<script setup lang="ts">
import PodcastEpisodeDetailView from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
