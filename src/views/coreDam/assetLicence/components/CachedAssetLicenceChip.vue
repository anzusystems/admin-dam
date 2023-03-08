<script lang="ts" setup>
import CachedChip from '@/views/coreDam/user/components/CachedChip.vue'
import { ROUTE } from '@/router/routes'
import type { IntegerId } from '@anzusystems/common-admin'
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
  <CachedChip
    :id="id"
    :get-cached-fn="getCachedAssetLicence"
    :route="ROUTE.DAM.ASSET_LICENCE.DETAIL"
    display-text-path="title"
  />
</template>
