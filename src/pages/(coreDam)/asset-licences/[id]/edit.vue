<script setup lang="ts">
import AssetLicenceEditView from '@/domains/coreDam/assetLicence/components/AssetLicenceEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/asset-licences/:id(\\d+)/edit',
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
