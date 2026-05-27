<script setup lang="ts">
import AssetFileDetailView from '@/views/coreDam/asset/detail/AssetFileDetailView.vue'
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
  <AssetFileDetailView />
</template>
