<script setup lang="ts">
import ExternalProviderAssetListView from '@/views/coreDam/externalProviderAsset/ExternalProviderAssetListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS],
    layout: 'AppLayoutMain',
  },
})
</script>

<template>
  <ExternalProviderAssetListView />
</template>
