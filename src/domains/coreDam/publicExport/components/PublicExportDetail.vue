<script lang="ts" setup>
import { ACopyText, ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import ExportTypeChip from '@/domains/coreDam/publicExport/components/ExportTypeChip.vue'
import { usePublicExportOneStore } from '@/domains/coreDam/publicExport/store/publicExportStore'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'

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
      <DamTrackingFields :data="publicExport" />
    </VCol>
  </VRow>
</template>
