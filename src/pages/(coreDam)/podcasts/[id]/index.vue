<script setup lang="ts">
import PodcastDetailView from '@/domains/coreDam/podcast/components/PodcastDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/podcasts/:id([0-9a-f-]{36})',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PODCAST_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.podcast.detail',
  },
})
</script>

<template>
  <PodcastDetailView />
</template>
