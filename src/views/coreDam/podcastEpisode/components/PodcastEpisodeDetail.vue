<script lang="ts" setup>
import { ACopyText, ADatetime, ARow, AUserAndTimeTrackingFields, COMMON_CONFIG } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePodcastEpisodeOneStore } from '@/stores/coreDam/podcastEpisodeStore'
import { computed } from 'vue'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import PodcastLastImportStatusChip from '@/views/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { podcastEpisode } = storeToRefs(usePodcastEpisodeOneStore())

const { t } = useI18n()
const router = useRouter()

const imageSrc = computed(() => {
  return podcastEpisode.value.links ? podcastEpisode.value.links.image_list.url : undefined
})

const onAssetChipClick = () => {
  router.push({ name: ROUTE.DAM.ASSET.DETAIL, params: { id: podcastEpisode.value.asset } })
}
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.podcastEpisode.model.texts.title')"
        :value="podcastEpisode.texts.title"
      />
      <ARow
        :title="t('coreDam.podcastEpisode.model.position')"
        :value="podcastEpisode.position"
      />
      <ARow
        :title="t('coreDam.podcastEpisode.model.texts.description')"
        :value="podcastEpisode.texts.description"
      />
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
      <ARow
        :title="t('coreDam.podcastEpisode.model.attributes.rssUrl')"
        :value="podcastEpisode.attributes.rssUrl"
      />
      <ARow
        :title="t('coreDam.podcastEpisode.model.attributes.extUrl')"
        :value="podcastEpisode.attributes.extUrl"
      />
      <ARow
        :title="t('coreDam.podcastEpisode.model.attributes.extId')"
        :value="podcastEpisode.attributes.extId"
      />
      <ARow :title="t('coreDam.podcastEpisode.model.dates.publicationDate')">
        <ADatetime :date-time="podcastEpisode.dates.publicationDate" />
      </ARow>
      <ARow :title="t('coreDam.podcastEpisode.model.attributes.lastImportStatus')">
        <PodcastLastImportStatusChip :status="podcastEpisode.attributes.lastImportStatus" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.podcastEpisode.model.id')">
        <ACopyText :value="podcastEpisode.id" />
      </ARow>
      <ARow
        v-if="imageSrc"
        title="Image"
      >
        <AssetImage
          :src="imageSrc"
          use-component
        />
      </ARow>
      <ARow :title="t('coreDam.podcastEpisode.model.asset')">
        <VChip
          size="small"
          :append-icon="COMMON_CONFIG.CHIP.ICON.LINK"
          label
          @click.stop="onAssetChipClick"
        >
          {{ podcastEpisode.asset }}
        </VChip>
      </ARow>
      <AUserAndTimeTrackingFields :data="podcastEpisode" />
    </VCol>
  </VRow>
</template>
