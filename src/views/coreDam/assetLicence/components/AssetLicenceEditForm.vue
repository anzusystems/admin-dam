<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useAssetLicenceEditActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import { useAssetLicenceValidation } from '@/views/coreDam/assetLicence/composables/assetLicenceValidation'
import ExtSystemRemoteAutocomplete from '@/views/coreDam/extSystem/components/ExtSystemRemoteAutocomplete.vue'

const { assetLicence } = useAssetLicenceEditActions()

const { v$ } = useAssetLicenceValidation(assetLicence)

const { t } = useI18n()
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
            v-model="assetLicence.name"
            :label="t('coreDam.assetLicence.model.name')"
            :v="v$.assetLicence.name"
            data-cy="asset-licence-name"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="assetLicence.extId"
            :label="t('coreDam.assetLicence.model.extId')"
            :v="v$.assetLicence.extId"
            data-cy="asset-licence-ext-id"
          />
        </ARow>
        <ARow>
          <ExtSystemRemoteAutocomplete
            v-model="assetLicence.extSystem"
            :label="t('coreDam.assetLicence.model.extSystem')"
            :v="v$.assetLicence.extSystem"
            data-cy="asset-licence-ext-system"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
