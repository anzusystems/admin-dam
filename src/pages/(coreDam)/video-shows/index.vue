<script setup lang="ts">
import VideoShowListView from '@/domains/coreDam/videoShow/components/VideoShowListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
