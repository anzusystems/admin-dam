<script lang="ts" setup>
import { ACachedChip } from '@anzusystems/common-admin'
import { useCachedAssetLicenceGroups } from '@/domains/coreDam/assetLicenceGroup/composables/cachedAssetLicenceGroups'

withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const { getCachedAssetLicenceGroup } = useCachedAssetLicenceGroups()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedAssetLicenceGroup"
    :route="'/(coreDam)/asset-licence-groups/[id]'"
    display-text-path="name"
  />
</template>
