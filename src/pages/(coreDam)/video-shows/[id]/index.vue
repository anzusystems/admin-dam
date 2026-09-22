<script setup lang="ts">
import VideoShowDetailView from '@/domains/coreDam/videoShow/components/VideoShowDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
