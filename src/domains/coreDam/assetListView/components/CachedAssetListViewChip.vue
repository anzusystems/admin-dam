<script lang="ts" setup>
import { ACachedChip } from '@anzusystems/common-admin'
import { useCachedAssetListViews } from '@/domains/coreDam/assetListView/composables/cachedAssetListViews'

withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const { getCachedAssetListView } = useCachedAssetListViews()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedAssetListView"
    :route="'/(coreDam)/asset-list-views/[id]'"
    display-text-path="name"
  />
</template>
