<script setup lang="ts">
import ExtSystemEditView from '@/views/coreDam/extSystem/ExtSystemEditView.vue'
import { ACL } from '@/composables/auth/auth'

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
