<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { useCachedTtsNarrationRequests } from '@/domains/coreDam/ttsNarrationRequest/composables/cachedTtsNarrationRequests'

withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const { getCachedTtsNarrationRequest } = useCachedTtsNarrationRequests()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedTtsNarrationRequest"
    :route="'/(coreDam)/tts-narration-requests/[id]'"
    display-text-path="displayText"
  />
</template>
