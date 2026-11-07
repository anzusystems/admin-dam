<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import { useVideoShowOneStore } from '@/domains/coreDam/videoShow/store/videoShowStore'

const { videoShow } = storeToRefs(useVideoShowOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.videoShow.model.texts.title')"
        :value="videoShow.texts.title"
      />
      <ARow
        :title="t('coreDam.videoShow.model.attributes.webOrderPosition')"
        :value="videoShow.attributes.webOrderPosition"
      />
      <ARow
        :title="t('coreDam.videoShow.model.attributes.mobileOrderPosition')"
        :value="videoShow.attributes.mobileOrderPosition"
      />
      <ARow :title="t('coreDam.videoShow.model.flags.webPublicExportEnabled')">
        <ABooleanValue :value="videoShow.flags.webPublicExportEnabled" />
      </ARow>
      <ARow :title="t('coreDam.videoShow.model.flags.mobilePublicExportEnabled')">
        <ABooleanValue :value="videoShow.flags.mobilePublicExportEnabled" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.videoShow.model.id')">
        <ACopyText
          :value="videoShow.id"
          data-cy="video-show-id"
        />
      </ARow>
      <DamTrackingFields :data="videoShow" />
    </VCol>
  </VRow>
</template>
