<script setup lang="ts">
import ExternalProviderAssetListView from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
