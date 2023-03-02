<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePodcastOneStore } from '@/stores/coreDam/podcastStore'
import PodcastModeChip from '@/views/coreDam/podcast/components/PodcastModeChip.vue'
import PodcastLastImportStatusChip from '@/views/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import { computed } from 'vue'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'

const { podcast } = storeToRefs(usePodcastOneStore())

const { t } = useI18n()

const imageSrc = computed(() => {
  return podcast.value.links ? podcast.value.links.image_list.url : undefined
})
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.podcast.model.texts.title')" :value="podcast.texts.title" />
      <ARow :title="t('coreDam.podcast.model.texts.description')" :value="podcast.texts.description" />
      <ARow :title="t('coreDam.podcast.model.attributes.mode')">
        <PodcastModeChip :mode="podcast.attributes.mode" />
      </ARow>
      <ARow :title="t('coreDam.podcast.model.attributes.rssUrl')" :value="podcast.attributes.rssUrl" />
      <ARow :title="t('coreDam.podcast.model.attributes.lastImportStatus')">
        <PodcastLastImportStatusChip :status="podcast.attributes.lastImportStatus" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.podcast.model.id')">
        <ACopyText :value="podcast.id" data-cy="podcast-id" />
      </ARow>
      <ARow v-if="imageSrc" title="Image">
        <AssetImage :src="imageSrc" use-component />
      </ARow>
      <AUserAndTimeTrackingFields :data="podcast" />
    </VCol>
  </VRow>
</template>
