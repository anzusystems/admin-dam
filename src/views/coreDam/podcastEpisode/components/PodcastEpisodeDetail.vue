<script lang="ts" setup>
import { ACopyText, ADatetime, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePodcastEpisodeOneStore } from '@/stores/coreDam/podcastEpisodeStore'
import { computed } from 'vue'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'

const { podcastEpisode } = storeToRefs(usePodcastEpisodeOneStore())

const { t } = useI18n()

const imageSrc = computed(() => {
  return podcastEpisode.value.links ? podcastEpisode.value.links.image_list.url : undefined
})
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.podcastEpisode.model.texts.title')" :value="podcastEpisode.texts.title" />
      <ARow :title="t('coreDam.podcastEpisode.model.position')" :value="podcastEpisode.position" />
      <ARow :title="t('coreDam.podcastEpisode.model.texts.description')" :value="podcastEpisode.texts.description" />
      <ARow
        :title="t('coreDam.podcastEpisode.model.texts.rawDescription')"
        :value="podcastEpisode.texts.rawDescription"
      />
      <ARow
        :title="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
        :value="podcastEpisode.attributes.seasonNumber"
      />
      <ARow
        :title="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
        :value="podcastEpisode.attributes.episodeNumber"
      />
      <ARow :title="t('coreDam.podcastEpisode.model.attributes.extId')" :value="podcastEpisode.attributes.extId" />
      <ARow :title="t('coreDam.podcastEpisode.model.dates.publicationDate')">
        <ADatetime :date-time="podcastEpisode.dates.publicationDate" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.podcastEpisode.model.id')">
        <ACopyText :value="podcastEpisode.id" />
      </ARow>
      <ARow v-if="imageSrc" title="Image">
        <AssetImage :src="imageSrc" use-component />
      </ARow>
      <ARow :title="t('coreDam.podcastEpisode.model.asset')">
        {{ podcastEpisode.asset }}
      </ARow>
      <AUserAndTimeTrackingFields :data="podcastEpisode" />
    </VCol>
  </VRow>
</template>
