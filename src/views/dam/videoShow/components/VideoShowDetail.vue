<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { useVideoShowOneStore } from '@/stores/dam/videoShowStore'

const { videoShow } = storeToRefs(useVideoShowOneStore())

const { t } = useI18n()

// const imageSrc = computed(() => {
//   return videoShow.value.links ? videoShow.value.links.image_list.url : undefined
// })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.videoShow.model.texts.title')" :value="videoShow.texts.title" />
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.videoShow.model.id')">
          <ACopyText :value="videoShow.id" data-cy="video-show-id" />
        </ARow>
        <!--        <ARow v-if="imageSrc" title="Image">-->
        <!--          <AssetImage :src="imageSrc" use-component />-->
        <!--        </ARow>-->
        <AUserAndTimeTrackingFields :data="videoShow" />
      </ACard>
    </VCol>
  </VRow>
</template>
