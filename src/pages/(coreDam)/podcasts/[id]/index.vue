<script setup lang="ts">
import PodcastDetailView from '@/views/coreDam/podcast/PodcastDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
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
