<script setup lang="ts">
import PodcastEditView from '@/domains/coreDam/podcast/components/PodcastEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
