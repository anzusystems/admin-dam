<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useCachedTtsNarrationRequests } from '@/views/coreDam/ttsNarrationRequest/composables/cachedTtsNarrationRequests'

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
    :route="ROUTE.DAM.TTS_NARRATION_REQUEST.DETAIL"
    display-text-path="displayText"
  />
</template>
