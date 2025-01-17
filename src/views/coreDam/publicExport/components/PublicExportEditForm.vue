<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/publicExportApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, AFormValueObjectOptionsSelect, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { usePublicExportEditActions } from '@/views/coreDam/publicExport/composables/publicExportActions'
import { usePublicExportValidation } from '@/views/coreDam/publicExport/composables/publicExportValidation'
import { useExportTypeTypes } from '@/model/coreDam/valueObject/ExportType'

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
            v-model="publicExport.phrase"
            :label="t('coreDam.publicExport.model.phrase')"
            :v="v$.publicExport.phrase"
            data-cy="publicExport-phrase"
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
          todo
<!--          <AuthorRemoteAutocomplete-->
<!--            v-model="publicExport.authorReplacement"-->
<!--            :label="t('coreDam.publicExport.model.authorReplacement')"-->
<!--            data-cy="publicExport-authorReplacement"-->
<!--          />-->
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
