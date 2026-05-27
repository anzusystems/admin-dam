<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/publicExport/api/publicExportApi'
import {
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
} from '@anzusystems/common-admin'
import { usePublicExportEditActions } from '@/domains/coreDam/publicExport/composables/publicExportActions'
import { usePublicExportValidation } from '@/domains/coreDam/publicExport/composables/publicExportValidation'
import { useExportTypeTypes } from '@/domains/coreDam/asset/valueObject/ExportType'
import { damClient } from '@/shared/apiClients/damClient'

const { publicExport } = usePublicExportEditActions()

const { v$ } = usePublicExportValidation(publicExport)

const { t } = useI18n()

const { exportTypeOptions } = useExportTypeTypes()
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <ARow>
          <AFormTextField
            v-model="publicExport.slug"
            :label="t('coreDam.publicExport.model.slug')"
            :v="v$.publicExport.slug"
            data-cy="publicExport-slug"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="publicExport.type"
            :label="t('coreDam.publicExport.model.type')"
            :items="exportTypeOptions"
            data-cy="publicExport-type"
          />
        </ARow>
        <ARow>
          <DamAssetLicenceRemoteAutocomplete
            v-model="publicExport.assetLicence"
            :client="damClient"
            :label="t('coreDam.publicExport.model.assetLicence')"
            data-cy="publicExport-licence"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
