<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
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
      <ARow
        :title="t('coreDam.assetLicence.model.name')"
        :value="assetLicence.name"
      />
      <ARow
        :title="t('coreDam.assetLicence.model.extId')"
        :value="assetLicence.extId"
      />
      <ARow :title="t('coreDam.assetLicence.model.extSystem')">
        <CachedExtSystemChip :id="assetLicence.extSystem" />
      </ARow>
      <ARow :title="t('coreDam.assetLicence.model.flags.manualUploadAllowed')">
        <ABooleanValue :value="assetLicence.flags.manualUploadAllowed" />
      </ARow>
      <ARow :title="t('coreDam.assetLicence.model.flags.directUseAllowed')">
        <ABooleanValue :value="assetLicence.flags.directUseAllowed" />
      </ARow>
      <ARow :title="t('coreDam.assetLicence.model.autoDelete.active')">
        <ABooleanValue :value="assetLicence.autoDelete.active" />
      </ARow>
      <ARow
        v-if="assetLicence.autoDelete.active"
        :title="t('coreDam.assetLicence.model.autoDelete.olderThanDays')"
        :value="assetLicence.autoDelete.olderThanDays"
      />
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.assetLicence.model.id')">
        <ACopyText :value="assetLicence.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="assetLicence" />
    </VCol>
  </VRow>
</template>
