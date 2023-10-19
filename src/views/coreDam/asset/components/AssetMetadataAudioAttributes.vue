<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { AudioFile } from '@/types/coreDam/File'
import { prettyDuration } from '@/utils/file'

withDefaults(
  defineProps<{
    file: AudioFile
  }>(),
  {}
)

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol>{{ t('coreDam.audioFile.model.audioAttributes.duration') }}</VCol>
    <VCol cols="9">
      {{ prettyDuration(file.audioAttributes.duration) }}
    </VCol>
  </VRow>
  <VRow>
    <VCol>{{ t('coreDam.audioFile.model.audioAttributes.codecName') }}</VCol>
    <VCol cols="9">
      {{ file.audioAttributes.codecName }}
    </VCol>
  </VRow>
</template>
