<script setup lang="ts">
import AssetListView from '@/views/coreDam/asset/list/AssetListView.vue'
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
  <AssetListView />
</template>
