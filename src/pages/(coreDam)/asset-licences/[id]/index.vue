<script setup lang="ts">
import AssetLicenceDetailView from '@/views/coreDam/assetLicence/AssetLicenceDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/asset-licences/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicence.detail',
  },
})
</script>

<template>
  <AssetLicenceDetailView />
</template>
