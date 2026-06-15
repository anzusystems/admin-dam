<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { useCachedVoiceFamiliesById } from '@/domains/coreDam/voiceFamily/composables/cachedVoiceFamilies'

withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const { getCachedVoiceFamily } = useCachedVoiceFamiliesById()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedVoiceFamily"
    :route="'/(coreDam)/voice-families/[id]'"
    display-text-path="name"
  />
</template>
