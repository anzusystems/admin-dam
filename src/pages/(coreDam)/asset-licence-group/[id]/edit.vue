<script setup lang="ts">
import AssetLicenceGroupEditView from '@/views/coreDam/assetLicenceGroup/AssetLicenceGroupEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/asset-licence-group/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_READ, ACL.DAM_ASSET_LICENCE_GROUP_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.edit',
  },
})
</script>

<template>
  <AssetLicenceGroupEditView />
</template>
