<script setup lang="ts">
import AssetDetailView from '@/domains/coreDam/asset/components/detail/AssetDetailView.vue'
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
  <AssetDetailView />
</template>
