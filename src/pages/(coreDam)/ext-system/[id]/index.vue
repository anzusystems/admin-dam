<script setup lang="ts">
import ExtSystemDetailView from '@/views/coreDam/extSystem/ExtSystemDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/ext-system/:id(\\d+)',
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
