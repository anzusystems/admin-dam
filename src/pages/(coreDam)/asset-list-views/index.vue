<script setup lang="ts">
import AssetListViewListView from '@/domains/coreDam/assetListView/components/AssetListViewListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LIST_VIEW_UI, ACL.DAM_ASSET_LIST_VIEW_LIST],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetListView.list',
  },
})
</script>

<template>
  <AssetListViewListView />
</template>
