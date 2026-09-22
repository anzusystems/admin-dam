<script setup lang="ts">
import AssetLicenceListView from '@/domains/coreDam/assetLicence/components/AssetLicenceListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
