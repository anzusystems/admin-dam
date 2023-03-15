<script setup lang="ts">
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import LazyVideoShowChip from '@/views/coreDam/videoShow/components/LazyVideoShowChip.vue'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    item: VideoShowEpisode
  }>(),
  {}
)

const { t } = useI18n()
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">
    <VRow>
      <VCol>
        <div class="font-weight-bold">{{ item.texts.title }}</div>
      </VCol>
    </VRow>
    <VRow>
      <VCol>{{ t('coreDam.videoShowEpisode.model.videoShow') }}: <LazyVideoShowChip :id="item.videoShow" /></VCol>
    </VRow>
  </div>
</template>
