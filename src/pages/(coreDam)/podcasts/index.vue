<script setup lang="ts">
import PodcastListView from '@/views/coreDam/podcast/PodcastListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PODCAST_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.podcast.list',
  },
})
</script>

<template>
  <PodcastListView />
</template>
