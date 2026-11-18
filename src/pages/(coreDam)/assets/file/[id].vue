<script setup lang="ts">
import AssetFileDetailView from '@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_READ],
    layout: 'AppLayoutMain',
  },
})
</script>

<template>
  <!-- AppLayoutMain is a bare VApp: without this the page has no main landmark. -->
  <VMain>
    <AssetFileDetailView />
  </VMain>
</template>
