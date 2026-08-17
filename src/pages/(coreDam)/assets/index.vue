<script setup lang="ts">
import AssetListView from '@/domains/coreDam/asset/components/list/AssetListView.vue'
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
  <AssetListView />
</template>
