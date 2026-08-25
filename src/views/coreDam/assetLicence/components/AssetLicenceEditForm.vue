<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import { useI18n } from 'vue-i18n'
import { AFormSwitch, AFormTextField, ARow, ASystemEntityScope, DamExtSystemRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAssetLicenceEditActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import { useAssetLicenceValidation } from '@/views/coreDam/assetLicence/composables/assetLicenceValidation'
import { damClient } from '@/services/api/clients/damClient'

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
          <DamExtSystemRemoteAutocomplete
            v-model="assetLicence.extSystem"
            :client="damClient"
            :label="t('coreDam.assetLicence.model.extSystem')"
            :v="v$.assetLicence.extSystem"
            data-cy="asset-licence-ext-system"
          />
        </ARow>
        <ARow>
          <AFormSwitch
            v-model="assetLicence.flags.manualUploadAllowed"
            :label="t('coreDam.assetLicence.model.flags.manualUploadAllowed')"
            data-cy="asset-licence-manual-upload-allowed"
          />
        </ARow>
        <ARow>
          <AFormSwitch
            v-model="assetLicence.flags.directUseAllowed"
            :label="t('coreDam.assetLicence.model.flags.directUseAllowed')"
            data-cy="asset-licence-direct-use-allowed"
          />
        </ARow>
        <ARow>
          <AFormSwitch
            v-model="assetLicence.autoDelete.active"
            :label="t('coreDam.assetLicence.model.autoDelete.active')"
            data-cy="asset-licence-auto-delete-active"
          />
        </ARow>
        <ARow v-if="assetLicence.autoDelete.active">
          <AFormTextField
            v-model="assetLicence.autoDelete.olderThanDays"
            :label="t('coreDam.assetLicence.model.autoDelete.olderThanDays')"
            :v="v$.assetLicence.autoDelete.olderThanDays"
            type="number"
            :step="1"
            data-cy="asset-licence-auto-delete-older-than-days"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
