<script setup lang="ts">
import DistributionCategorySelectEditView from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/distribution-category-selects/:id([0-9a-f-]{36})/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ, ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.distributionCategorySelect.edit',
  },
})
</script>

<template>
  <DistributionCategorySelectEditView />
</template>
