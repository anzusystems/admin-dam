<script setup lang="ts">
import JobDetailView from '@/views/coreDam/job/JobDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_JOB_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.job.detail',
  },
})
</script>

<template>
  <JobDetailView />
</template>
