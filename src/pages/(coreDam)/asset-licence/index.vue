<script setup lang="ts">
import AssetLicenceListView from '@/views/coreDam/assetLicence/AssetLicenceListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicence.list',
  },
})
</script>

<template>
  <AssetLicenceListView />
</template>
