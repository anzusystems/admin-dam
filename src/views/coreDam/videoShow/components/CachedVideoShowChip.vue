<script lang="ts" setup>
import { ACachedChip } from '@anzusystems/common-admin'
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
    :route="'/(coreDam)/video-shows/[id]'"
    display-text-path="title"
  />
</template>
