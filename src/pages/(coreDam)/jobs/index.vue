<script setup lang="ts">
import JobListView from '@/views/coreDam/job/JobListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_JOB_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.job.list',
  },
})
</script>

<template>
  <JobListView />
</template>
