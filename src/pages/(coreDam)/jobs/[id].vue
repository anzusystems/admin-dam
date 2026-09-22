<script setup lang="ts">
import JobDetailView from '@/domains/coreDam/job/components/JobDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
