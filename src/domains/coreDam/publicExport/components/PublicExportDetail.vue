<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { usePublicExportOneStore } from '@/domains/coreDam/publicExport/store/publicExportStore'
import ExportTypeChip from '@/domains/coreDam/publicExport/components/ExportTypeChip.vue'
import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'

const { publicExport } = storeToRefs(usePublicExportOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.publicExport.model.slug')"
        :value="publicExport.slug"
      />
      <ARow :title="t('coreDam.publicExport.model.type')">
        <ExportTypeChip :type="publicExport.type" />
      </ARow>
      <ARow :title="t('coreDam.publicExport.model.assetLicence')">
        <CachedAssetLicenceChip
          v-for="licence in publicExport.licences"
          :id="licence"
          :key="licence"
          class="mr-1"
        />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.publicExport.model.id')">
        <ACopyText :value="publicExport.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="publicExport" />
    </VCol>
  </VRow>
</template>
