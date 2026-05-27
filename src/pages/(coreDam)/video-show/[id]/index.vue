<script setup lang="ts">
import VideoShowDetailView from '@/views/coreDam/videoShow/VideoShowDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.videoShow.detail',
  },
})
</script>

<template>
  <VideoShowDetailView />
</template>
