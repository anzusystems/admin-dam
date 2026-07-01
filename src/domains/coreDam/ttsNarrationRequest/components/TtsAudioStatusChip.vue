<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsAudioStatusType } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { useTtsAudioStatus } from '@/domains/coreDam/ttsNarrationRequest/valueObject/TtsAudioStatus'

const props = withDefaults(
  defineProps<{
    status: TtsAudioStatusType
  }>(),
  {}
)

const { getTtsAudioStatusOption } = useTtsAudioStatus()

const statusOption = computed(() => getTtsAudioStatusOption(props.status))
</script>

<template>
  <AChipNoLink
    v-if="statusOption"
    :color="statusOption.color"
  >
    {{ statusOption.title }}
  </AChipNoLink>
</template>
