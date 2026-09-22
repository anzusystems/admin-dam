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
  <AssetFileDetailView />
</template>
