<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsAudioStatusType } from '@/types/coreDam/TtsNarrationRequest'
import { useTtsAudioStatus } from '@/model/coreDam/valueObject/TtsAudioStatus'

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
