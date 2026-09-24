<script setup lang="ts">
import AssetListViewEditView from '@/domains/coreDam/assetListView/components/AssetListViewEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/asset-list-views/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LIST_VIEW_READ, ACL.DAM_ASSET_LIST_VIEW_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetListView.edit',
  },
})
</script>

<template>
  <AssetListViewEditView />
</template>
