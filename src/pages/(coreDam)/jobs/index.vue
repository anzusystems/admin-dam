<script setup lang="ts">
import JobListView from '@/domains/coreDam/job/components/JobListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
