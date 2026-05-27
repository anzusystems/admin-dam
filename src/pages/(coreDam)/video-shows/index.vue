<script setup lang="ts">
import VideoShowListView from '@/views/coreDam/videoShow/VideoShowListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.videoShow.list',
  },
})
</script>

<template>
  <VideoShowListView />
</template>
