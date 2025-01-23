<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useVideoShowOneStore } from '@/stores/coreDam/videoShowStore'

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
      <ARow
        :title="t('coreDam.videoShow.model.flags.webPublicExportEnabled')"
      >
        <ABooleanValue :value="videoShow.flags.webPublicExportEnabled" />
      </ARow>
      <ARow
        :title="t('coreDam.videoShow.model.flags.mobilePublicExportEnabled')"
      >
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
      <AUserAndTimeTrackingFields :data="videoShow" />
    </VCol>
  </VRow>
</template>
