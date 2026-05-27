<script setup lang="ts">
import DistributionCategorySelectDetailView from '@/views/coreDam/distributionCategorySelect/DistributionCategorySelectDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.distributionCategorySelect.detail',
  },
})
</script>

<template>
  <DistributionCategorySelectDetailView />
</template>
