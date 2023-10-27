<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { VideoFile } from '@/types/coreDam/File'
import { prettyBps, prettyDuration } from '@/utils/file'

withDefaults(
  defineProps<{
    file: VideoFile
  }>(),
  {}
)

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol>{{ t('coreDam.videoFile.model.videoAttributes.duration') }}</VCol>
    <VCol cols="9">
      {{ prettyDuration(file.videoAttributes.duration) }}
    </VCol>
  </VRow>
  <VRow>
    <VCol>{{ t('coreDam.videoFile.model.videoAttributes.bitrate') }}</VCol>
    <VCol cols="9">
      {{ prettyBps(file.videoAttributes.bitrate) }}
    </VCol>
  </VRow>
  <VRow>
    <VCol>{{ t('coreDam.videoFile.model.videoAttributes.codecName') }}</VCol>
    <VCol cols="9">
      {{ file.videoAttributes.codecName }}
    </VCol>
  </VRow>
</template>
