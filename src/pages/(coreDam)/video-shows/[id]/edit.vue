<script setup lang="ts">
import VideoShowEditView from '@/domains/coreDam/videoShow/components/VideoShowEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
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
