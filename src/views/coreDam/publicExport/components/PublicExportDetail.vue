<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePublicExportOneStore } from '@/stores/coreDam/publicExportStore'
import ExportTypeChip from '@/views/coreDam/publicExport/components/ExportTypeChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'

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
      <ARow
        :title="t('coreDam.publicExport.model.type')"
      >
        <ExportTypeChip
          :type="publicExport.type"
        />
      </ARow>
      <ARow
        :title="t('coreDam.publicExport.model.assetLicence')"
      >
        <CachedAssetLicenceChip
          :id="publicExport.assetLicence"
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
