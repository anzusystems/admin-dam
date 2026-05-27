<script lang="ts" setup>
import type { IntegerId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'

withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const { getCachedAssetLicence } = useCachedAssetLicences()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedAssetLicence"
    :route="'/(coreDam)/asset-licence/[id]'"
    display-text-path="name"
  />
</template>
