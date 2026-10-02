<script setup lang="ts">
import VideoShowEditView from '@/domains/coreDam/videoShow/components/VideoShowEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/video-shows/:id([0-9a-f-]{36})/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ, ACL.DAM_VIDEO_SHOW_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.videoShow.edit',
  },
})
</script>

<template>
  <VideoShowEditView />
</template>
