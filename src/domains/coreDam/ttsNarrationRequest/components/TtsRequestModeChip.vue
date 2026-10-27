<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import { computed } from 'vue'

import type { TtsRequestModeType } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { useTtsRequestMode } from '@/domains/coreDam/ttsNarrationRequest/valueObject/TtsRequestMode'

const props = withDefaults(
  defineProps<{
    mode: TtsRequestModeType
  }>(),
  {}
)

const { getTtsRequestModeOption } = useTtsRequestMode()

const modeOption = computed(() => getTtsRequestModeOption(props.mode))
</script>

<template>
  <AChipNoLink
    v-if="modeOption"
    :color="modeOption.color"
  >
    {{ modeOption.title }}
  </AChipNoLink>
</template>
