<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsRequestModeType } from '@/types/coreDam/TtsNarrationRequest'
import { useTtsRequestMode } from '@/model/coreDam/valueObject/TtsRequestMode'

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
