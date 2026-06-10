<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'
import { useVoiceDiscriminator } from '@/model/coreDam/valueObject/VoiceDiscriminator'

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
