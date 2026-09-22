<script setup lang="ts">
import DistributionCategorySelectListView from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.distributionCategorySelect.list',
  },
})
</script>

<template>
  <DistributionCategorySelectListView />
</template>
