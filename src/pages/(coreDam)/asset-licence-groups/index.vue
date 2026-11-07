<script setup lang="ts">
import AssetLicenceGroupListView from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LICENCE_GROUP_UI, ACL.DAM_ASSET_LICENCE_GROUP_LIST],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetLicenceGroup.list',
  },
})
</script>

<template>
  <AssetLicenceGroupListView />
</template>
