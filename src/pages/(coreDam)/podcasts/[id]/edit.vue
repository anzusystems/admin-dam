<script setup lang="ts">
import PodcastEditView from '@/views/coreDam/podcast/PodcastEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
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
