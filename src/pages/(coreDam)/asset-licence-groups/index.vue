<script setup lang="ts">
import AssetLicenceGroupListView from '@/views/coreDam/assetLicenceGroup/AssetLicenceGroupListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.list',
  },
})
</script>

<template>
  <AssetLicenceGroupListView />
</template>
