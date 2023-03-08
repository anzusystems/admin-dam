<script lang="ts" setup>
import CachedChip from '@/views/coreDam/user/components/CachedChip.vue'
import { ROUTE } from '@/router/routes'
import { useCachedPodcasts } from '@/views/coreDam/podcast/composables/cachedPodcasts'
import type { DocId } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const { getCachedPodcast } = useCachedPodcasts()
</script>

<template>
  <CachedChip :id="id" :get-cached-fn="getCachedPodcast" :route="ROUTE.DAM.PODCAST.DETAIL" display-text-path="title" />
</template>
