<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'

withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const { getCachedKeyword } = useCachedKeywords()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedKeyword"
    :route="ROUTE.DAM.KEYWORD.DETAIL"
    display-text-path="name"
  />
</template>
