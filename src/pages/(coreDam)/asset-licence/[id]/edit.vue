<script setup lang="ts">
import AssetLicenceEditView from '@/views/coreDam/assetLicence/AssetLicenceEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/asset-licence/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_READ, ACL.DAM_ASSET_LICENCE_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicence.edit',
  },
})
</script>

<template>
  <AssetLicenceEditView />
</template>
