<script lang="ts" setup>
import type { IntegerId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'

withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const { getCachedExtSystem } = useCachedExtSystems()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedExtSystem"
    :route="ROUTE.DAM.EXT_SYSTEM.DETAIL"
    display-text-path="name"
  />
</template>
