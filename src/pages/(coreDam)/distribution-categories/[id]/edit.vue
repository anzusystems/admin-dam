<script setup lang="ts">
import DistributionCategoryEditView from '@/domains/coreDam/distributionCategory/components/DistributionCategoryEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/distribution-categories/:id([0-9a-f-]{36})/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_READ, ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.distributionCategory.edit',
  },
})
</script>

<template>
  <DistributionCategoryEditView />
</template>
