<script setup lang="ts">
import PodcastListView from '@/domains/coreDam/podcast/components/PodcastListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
