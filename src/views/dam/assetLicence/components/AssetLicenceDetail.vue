<script lang="ts" setup>
import { ACard, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAssetLicenceOneStore } from '@/stores/dam/assetLicenceStore'
import LazyExtSystemChip from '@/views/dam/extSystem/components/LazyExtSystemChip.vue'

const { assetLicence } = storeToRefs(useAssetLicenceOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.assetLicence.model.name')" :value="assetLicence.name" />
        <ARow :title="t('coreDam.assetLicence.model.extId')" :value="assetLicence.extId" />
        <ARow :title="t('coreDam.assetLicence.model.extSystem')">
          <LazyExtSystemChip :id="assetLicence.extSystem" />
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.assetLicence.model.id')">
          <ACopyText :value="assetLicence.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="assetLicence" />
      </ACard>
    </VCol>
  </VRow>
</template>
