<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { usePodcastEpisodeOneStore } from '@/stores/dam/podcastEpisodeStore'
import ADatetime from '@/components/common/ADatetime.vue'

const { podcastEpisode } = storeToRefs(usePodcastEpisodeOneStore())

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.podcastEpisode.model.texts.title')" :value="podcastEpisode.texts.title"></ARow>
        <ARow :title="t('coreDam.podcastEpisode.model.position')" :value="podcastEpisode.position"></ARow>
        <ARow
          :title="t('coreDam.podcastEpisode.model.texts.description')"
          :value="podcastEpisode.texts.description"
        ></ARow>
        <ARow
          :title="t('coreDam.podcastEpisode.model.texts.rawDescription')"
          :value="podcastEpisode.texts.rawDescription"
        ></ARow>
        <ARow
          :title="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
          :value="podcastEpisode.attributes.seasonNumber"
        ></ARow>
        <ARow
          :title="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
          :value="podcastEpisode.attributes.episodeNumber"
        ></ARow>
        <ARow
          :title="t('coreDam.podcastEpisode.model.attributes.extId')"
          :value="podcastEpisode.attributes.extId"
        ></ARow>
        <ARow :title="t('coreDam.podcastEpisode.model.dates.publicationDate')">
          <ADatetime :date-time="podcastEpisode.dates.publicationDate"></ADatetime>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.podcastEpisode.model.id')">
          <ACopyText :value="podcastEpisode.id"></ACopyText>
        </ARow>
        <ARow :title="t('coreDam.podcastEpisode.model.asset')">
          {{ podcastEpisode.asset }}
        </ARow>
        <AUserAndTimeTrackingFields :data="podcastEpisode" />
      </ACard>
    </VCol>
  </VRow>
</template>
