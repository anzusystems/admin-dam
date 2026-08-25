<script setup lang="ts">
import ExtSystemEditView from '@/domains/coreDam/extSystem/components/ExtSystemEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/ext-systems/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_EXT_SYSTEM_READ, ACL.DAM_EXT_SYSTEM_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.extSystem.edit',
  },
})
</script>

<template>
  <ExtSystemEditView />
</template>
