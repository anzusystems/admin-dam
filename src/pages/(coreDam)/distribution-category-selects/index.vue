<script setup lang="ts">
import DistributionCategorySelectListView from '@/views/coreDam/distributionCategorySelect/DistributionCategorySelectListView.vue'
import { ACL } from '@/composables/auth/auth'

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
