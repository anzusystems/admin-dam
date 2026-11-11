<script setup lang="ts">
import PodcastEpisodeEditView from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/podcasts/:id([0-9a-f-]{36})/episodes/:episodeId([0-9a-f-]{36})/edit',
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
