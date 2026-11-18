<script setup lang="ts">
import AssetListViewDetailView from '@/domains/coreDam/assetListView/components/AssetListViewDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/asset-list-views/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_ASSET_LIST_VIEW_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.assetListView.detail',
  },
})
</script>

<template>
  <AssetListViewDetailView />
</template>
