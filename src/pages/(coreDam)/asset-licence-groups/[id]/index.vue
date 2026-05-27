<script setup lang="ts">
import AssetLicenceGroupDetailView from '@/views/coreDam/assetLicenceGroup/AssetLicenceGroupDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/asset-licence-groups/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.detail',
  },
})
</script>

<template>
  <AssetLicenceGroupDetailView />
</template>
