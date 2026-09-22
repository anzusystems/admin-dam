<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { VoiceDiscriminatorType } from '@/domains/coreDam/voiceFamily/types/Voice'
import { useVoiceDiscriminator } from '@/domains/coreDam/voiceFamily/valueObject/VoiceDiscriminator'

const props = withDefaults(
  defineProps<{
    discriminator: VoiceDiscriminatorType
  }>(),
  {}
)

const { getVoiceDiscriminatorOption } = useVoiceDiscriminator()
const option = computed(() => getVoiceDiscriminatorOption(props.discriminator))
</script>

<template>
  <AChipNoLink v-if="option">
    {{ option.title }}
  </AChipNoLink>
</template>
