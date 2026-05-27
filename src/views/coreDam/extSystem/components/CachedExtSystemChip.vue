<script lang="ts" setup>
import type { IntegerId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
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
    :route="'/(coreDam)/ext-system/[id]'"
    display-text-path="name"
  />
</template>
