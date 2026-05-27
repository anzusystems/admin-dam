<script setup lang="ts">
import ExtSystemListView from '@/views/coreDam/extSystem/ExtSystemListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_EXT_SYSTEM_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.extSystem.list',
  },
})
</script>

<template>
  <ExtSystemListView />
</template>
