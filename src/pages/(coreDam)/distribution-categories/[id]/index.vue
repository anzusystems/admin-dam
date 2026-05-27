<script setup lang="ts">
import DistributionCategoryDetailView from '@/views/coreDam/distributionCategory/DistributionCategoryDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
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
