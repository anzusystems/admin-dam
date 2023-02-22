<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { useVideoShowEpisodeOneStore } from '@/stores/dam/videoShowEpisodeStore'

const { videoShowEpisode } = storeToRefs(useVideoShowEpisodeOneStore())

const { t } = useI18n()

// const imageSrc = computed(() => {
//   return videoShowEpisode.value.links ? videoShowEpisode.value.links.image_list.url : undefined
// })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.videoShowEpisode.model.texts.title')" :value="videoShowEpisode.texts.title" />
        <ARow :title="t('coreDam.videoShowEpisode.model.position')" :value="videoShowEpisode.position" />
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.videoShowEpisode.model.id')">
          <ACopyText :value="videoShowEpisode.id" />
        </ARow>
        <!--        <ARow v-if="imageSrc" title="Image">-->
        <!--          <AssetImage :src="imageSrc" use-component />-->
        <!--        </ARow>-->
        <ARow :title="t('coreDam.videoShowEpisode.model.asset')">
          {{ videoShowEpisode.asset }}
        </ARow>
        <AUserAndTimeTrackingFields :data="videoShowEpisode" />
      </ACard>
    </VCol>
  </VRow>
</template>
