<script setup lang="ts">
import DistributionCategoryDetailView from '@/domains/coreDam/distributionCategory/components/DistributionCategoryDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/distribution-categories/:id([0-9a-f-]{36})',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.distributionCategory.detail',
  },
})
</script>

<template>
  <DistributionCategoryDetailView />
</template>
