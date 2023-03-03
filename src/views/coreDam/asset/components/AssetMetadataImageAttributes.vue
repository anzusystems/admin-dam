<script lang="ts" setup>
import ColorBox from '@/components/coreDam/ColorBox.vue'
import { useI18n } from 'vue-i18n'
import type { ImageFile } from '@/types/coreDam/File'

withDefaults(
  defineProps<{
    file: ImageFile
  }>(),
  {}
)

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol>{{ t('coreDam.asset.detail.info.field.dominantColor') }}</VCol>
    <VCol cols="9">
      <ColorBox :color="file.imageAttributes.mostDominantColor" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>{{ t('coreDam.asset.detail.info.field.width') }}</VCol>
    <VCol cols="9">{{ file.imageAttributes.width }} px</VCol>
  </VRow>
  <VRow>
    <VCol>{{ t('coreDam.asset.detail.info.field.height') }}</VCol>
    <VCol cols="9">{{ file.imageAttributes.height }} px</VCol>
  </VRow>
  <VRow>
    <VCol>{{ t('coreDam.asset.detail.info.field.ratio') }}</VCol>
    <VCol cols="9"> {{ file.imageAttributes.ratioWidth }} / {{ file.imageAttributes.ratioHeight }} </VCol>
  </VRow>
</template>
