<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { usePodcastOneStore } from '@/stores/dam/podcastStore'
import PodcastModeChip from '@/views/dam/podcast/components/PodcastModeChip.vue'
import PodcastLastImportStatusChip from '@/views/dam/podcast/components/PodcastLastImportStatusChip.vue'
import { computed } from 'vue'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'

const { podcast } = storeToRefs(usePodcastOneStore())

const { t } = useI18n({ useScope: 'global' })

const imageSrc = computed(() => {
  return podcast.value.links ? podcast.value.links.image_list.url : undefined
})
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.podcast.model.texts.title')" :value="podcast.texts.title"></ARow>
        <ARow :title="t('coreDam.podcast.model.texts.description')" :value="podcast.texts.description"></ARow>
        <ARow :title="t('coreDam.podcast.model.attributes.mode')">
          <PodcastModeChip :mode="podcast.attributes.mode" />
        </ARow>
        <ARow :title="t('coreDam.podcast.model.attributes.rssUrl')" :value="podcast.attributes.rssUrl"></ARow>
        <ARow :title="t('coreDam.podcast.model.attributes.lastImportStatus')">
          <PodcastLastImportStatusChip :status="podcast.attributes.lastImportStatus" />
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.podcast.model.id')">
          <ACopyText :value="podcast.id" data-cy="podcast-id"></ACopyText>
        </ARow>
        <ARow title="Image" v-if="imageSrc">
          <AssetImage :src="imageSrc" use-component />
        </ARow>
        <AUserAndTimeTrackingFields :data="podcast"></AUserAndTimeTrackingFields>
      </ACard>
    </VCol>
  </VRow>
</template>
