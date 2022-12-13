<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetLicenceApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { useAssetLicenceEditActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'
import { useAssetLicenceValidation } from '@/views/dam/assetLicence/composables/assetLicenceValidation'
import ExtSystemSelect from '@/views/dam/extSystem/components/ExtSystemSelect.vue'

const { assetLicence } = useAssetLicenceEditActions()

const { v$ } = useAssetLicenceValidation(assetLicence)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
            :label="t('coreDam.assetLicence.model.name')"
            v-model="assetLicence.name"
            :v="v$.assetLicence.name"
            data-cy="asset-licence-name"
          ></ATextField>
        </ARow>
        <ARow>
          <ATextField
            :label="t('coreDam.assetLicence.model.extId')"
            v-model="assetLicence.extId"
            :v="v$.assetLicence.extId"
            data-cy="asset-licence-ext-id"
          ></ATextField>
        </ARow>
        <ARow>
          <ExtSystemSelect
            :label="t('coreDam.assetLicence.model.extSystem')"
            v-model="assetLicence.extSystem"
            :v="v$.assetLicence.extSystem"
            data-cy="asset-licence-ext-system"
          ></ExtSystemSelect>
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
