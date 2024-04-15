<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAssetLicenceGroupOneStore } from '@/stores/coreDam/assetLicenceGroupStore'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'

const { assetLicenceGroup } = storeToRefs(useAssetLicenceGroupOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.assetLicenceGroup.model.name')"
        :value="assetLicenceGroup.name"
      />
      <ARow :title="t('coreDam.assetLicenceGroup.model.extSystem')">
        <CachedExtSystemChip :id="assetLicenceGroup.extSystem" />
      </ARow>
      <ARow :title="t('coreDam.assetLicenceGroup.model.licences')">
        <CachedAssetLicenceChip
          v-for="assetLicenceId in assetLicenceGroup.licences"
          :id="assetLicenceId"
          :key="assetLicenceId"
          class="mr-1"
        />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.assetLicenceGroup.model.id')">
        <ACopyText :value="assetLicenceGroup.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="assetLicenceGroup" />
    </VCol>
  </VRow>
</template>
