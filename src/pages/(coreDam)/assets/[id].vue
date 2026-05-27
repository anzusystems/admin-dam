<script setup lang="ts">
import AssetDetailView from '@/views/coreDam/asset/detail/AssetDetailView.vue'
import { ACL } from '@/composables/auth/auth'

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
