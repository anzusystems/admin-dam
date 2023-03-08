<script lang="ts" setup>
import CachedChip from '@/views/coreDam/user/components/CachedChip.vue'
import { ROUTE } from '@/router/routes'
import type { DocId } from '@anzusystems/common-admin'
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
  <CachedChip
    :id="id"
    :get-cached-fn="getCachedVideoShow"
    :route="ROUTE.DAM.VIDEO_SHOW.DETAIL"
    display-text-path="title"
  />
</template>
