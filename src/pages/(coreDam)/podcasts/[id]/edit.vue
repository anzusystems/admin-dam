<script setup lang="ts">
import PodcastEditView from '@/domains/coreDam/podcast/components/PodcastEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/podcasts/:id([0-9a-f-]{36})/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PODCAST_READ, ACL.DAM_PODCAST_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.podcast.edit',
  },
})
</script>

<template>
  <PodcastEditView />
</template>
