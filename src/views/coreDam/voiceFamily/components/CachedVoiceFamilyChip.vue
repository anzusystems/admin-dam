<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useCachedVoiceFamiliesById } from '@/views/coreDam/voiceFamily/composables/cachedVoiceFamilies'

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
    :route="ROUTE.DAM.VOICE_FAMILY.DETAIL"
    display-text-path="name"
  />
</template>
