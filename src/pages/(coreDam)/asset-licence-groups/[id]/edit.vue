<script setup lang="ts">
import AssetLicenceGroupEditView from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/asset-licence-groups/:id(\\d+)/edit',
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
