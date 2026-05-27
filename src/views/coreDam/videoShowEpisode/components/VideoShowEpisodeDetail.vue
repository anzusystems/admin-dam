<script lang="ts" setup>
import {
  ABooleanValue,
  ACopyText,
  ADatetime,
  ARow,
  AUserAndTimeTrackingFields,
  COMMON_CONFIG,
} from '@anzusystems/common-admin'
import { useVideoShowEpisodeOneStore } from '@/stores/coreDam/videoShowEpisodeStore'

const { videoShowEpisode } = storeToRefs(useVideoShowEpisodeOneStore())

const { t } = useI18n()
const router = useRouter()

const onAssetChipClick = () => {
  if (!videoShowEpisode.value.asset) return
  router.push({ name: '/(coreDam)/asset/[id]', params: { id: videoShowEpisode.value.asset } })
}
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.videoShowEpisode.model.texts.title')" :value="videoShowEpisode.texts.title" />
      <ARow :title="t('coreDam.videoShowEpisode.model.position')" :value="videoShowEpisode.position" />
      <ARow
        :title="t('coreDam.videoShowEpisode.model.attributes.webOrderPosition')"
        :value="videoShowEpisode.attributes.webOrderPosition"
      />
      <ARow
        :title="t('coreDam.videoShowEpisode.model.attributes.mobileOrderPosition')"
        :value="videoShowEpisode.attributes.mobileOrderPosition"
      />
      <ARow :title="t('coreDam.videoShowEpisode.model.flags.webPublicExportEnabled')">
        <ABooleanValue :value="videoShowEpisode.flags.webPublicExportEnabled" />
      </ARow>
      <ARow :title="t('coreDam.videoShowEpisode.model.flags.mobilePublicExportEnabled')">
        <ABooleanValue :value="videoShowEpisode.flags.mobilePublicExportEnabled" />
      </ARow>
      <ARow :title="t('coreDam.videoShowEpisode.model.dates.publicationDate')">
        <ADatetime :date-time="videoShowEpisode.dates.publicationDate" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.videoShowEpisode.model.id')">
        <ACopyText :value="videoShowEpisode.id" />
      </ARow>
      <ARow :title="t('coreDam.videoShowEpisode.model.asset')">
        <VChip size="small" :append-icon="COMMON_CONFIG.CHIP.ICON.LINK" label @click.stop="onAssetChipClick">
          {{ videoShowEpisode.asset }}
        </VChip>
      </ARow>
      <AUserAndTimeTrackingFields :data="videoShowEpisode" />
    </VCol>
  </VRow>
</template>
