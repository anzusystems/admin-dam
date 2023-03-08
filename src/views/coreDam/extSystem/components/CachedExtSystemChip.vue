<script lang="ts" setup>
import CachedChip from '@/views/coreDam/user/components/CachedChip.vue'
import { ROUTE } from '@/router/routes'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'
import type { IntegerId } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const { getCachedExtSystem } = useCachedExtSystems()
</script>

<template>
  <CachedChip
    :id="id"
    :get-cached-fn="getCachedExtSystem"
    :route="ROUTE.DAM.EXT_SYSTEM.DETAIL"
    display-text-path="name"
  />
</template>
