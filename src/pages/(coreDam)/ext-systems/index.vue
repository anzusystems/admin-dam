<script setup lang="ts">
import ExtSystemListView from '@/domains/coreDam/extSystem/components/ExtSystemListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
