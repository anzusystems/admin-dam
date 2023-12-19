<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useCachedVideoShows } from '@/views/coreDam/videoShow/composables/cachedVideoShow'

withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const { getCachedVideoShow } = useCachedVideoShows()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedVideoShow"
    :route="ROUTE.DAM.VIDEO_SHOW.DETAIL"
    display-text-path="title"
  />
</template>
