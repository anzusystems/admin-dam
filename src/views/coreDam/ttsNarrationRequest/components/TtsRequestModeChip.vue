<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsRequestMode } from '@/types/coreDam/TtsNarrationRequest'
import { ttsRequestModeColors, useTtsRequestMode } from '@/model/coreDam/valueObject/TtsRequestMode'

const props = withDefaults(
  defineProps<{
    mode: TtsRequestMode
  }>(),
  {}
)

const { getTtsRequestModeOption } = useTtsRequestMode()

const modeOption = computed(() => getTtsRequestModeOption(props.mode))
const color = computed(() => ttsRequestModeColors[props.mode])
</script>

<template>
  <AChipNoLink
    v-if="modeOption"
    :color="color"
  >
    {{ modeOption.title }}
  </AChipNoLink>
</template>
