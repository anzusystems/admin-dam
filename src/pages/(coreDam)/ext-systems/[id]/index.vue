<script setup lang="ts">
import ExtSystemDetailView from '@/domains/coreDam/extSystem/components/ExtSystemDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/ext-systems/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_EXT_SYSTEM_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.extSystem.detail',
  },
})
</script>

<template>
  <ExtSystemDetailView />
</template>
