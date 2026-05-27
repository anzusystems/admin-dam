<script setup lang="ts">
import DistributionCategoryListView from '@/views/coreDam/distributionCategory/DistributionCategoryListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.distributionCategory.list',
  },
})
</script>

<template>
  <DistributionCategoryListView />
</template>
