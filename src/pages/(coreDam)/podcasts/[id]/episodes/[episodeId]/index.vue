<script setup lang="ts">
import PodcastEpisodeDetailView from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/podcasts/:id([0-9a-f-]{36})/episodes/:episodeId([0-9a-f-]{36})',
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
