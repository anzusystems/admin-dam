<script setup lang="ts">
import DistributionCategorySelectDetailView from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
