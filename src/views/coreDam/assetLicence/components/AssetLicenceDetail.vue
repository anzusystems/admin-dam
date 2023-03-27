<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAssetLicenceOneStore } from '@/stores/coreDam/assetLicenceStore'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'

const { assetLicence } = storeToRefs(useAssetLicenceOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.assetLicence.model.name')" :value="assetLicence.name" />
      <ARow :title="t('coreDam.assetLicence.model.extId')" :value="assetLicence.extId" />
      <ARow :title="t('coreDam.assetLicence.model.extSystem')">
        <CachedExtSystemChip :id="assetLicence.extSystem" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.assetLicence.model.id')">
        <ACopyText :value="assetLicence.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="assetLicence" />
    </VCol>
  </VRow>
</template>
