<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/userApi'
import { AFormTextField, ARow, ASystemEntityScope, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { useUserEditActions } from '@/views/coreDam/user/composables/userActions'
import { useI18n } from 'vue-i18n'
import { useUpdateUserValidation } from '@/views/coreDam/user/composables/userValidation'
import ExtSystemRemoteAutocomplete from '@/views/coreDam/extSystem/components/ExtSystemRemoteAutocomplete.vue'
import DistributionServiceSelect from '@/views/coreDam/distribution/components/DistributionServiceSelect.vue'
import ExternalProviderAssetSelect from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetSelect.vue'
import AssetLicenceRemoteAutocomplete from '@/views/coreDam/assetLicence/components/AssetLicenceRemoteAutocomplete.vue'
import { UserAuthType } from '@anzusystems/common-admin'

const { userUpdate } = useUserEditActions()

const { damPubConfig } = useDamConfigState()

const { v$ } = useUpdateUserValidation(userUpdate, damPubConfig.value.userAuthType)

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
        <ARow
          v-if="damPubConfig.userAuthType === UserAuthType.JsonCredentials && !isUndefined(userUpdate.plainPassword)"
        >
          <AFormTextField
            v-model="userUpdate.plainPassword"
            :v="v$.userUpdate.plainPassword"
            type="password"
            data-cy="user-plain-password"
          />
        </ARow>
        <ARow>
          <AssetLicenceRemoteAutocomplete
            v-model="userUpdate.assetLicences"
            :label="t('coreDam.user.model.assetLicences')"
            :v="v$.userUpdate.assetLicences"
            multiple
            clearable
            data-cy="user-asset-licences"
          />
        </ARow>
        <ARow>
          <ExtSystemRemoteAutocomplete
            v-model="userUpdate.adminToExtSystems"
            :label="t('coreDam.user.model.adminToExtSystems')"
            multiple
            clearable
            data-cy="user-admin-to-ext-systems"
          />
        </ARow>
        <ARow>
          <ExternalProviderAssetSelect
            v-model="userUpdate.allowedAssetExternalProviders"
            :label="t('coreDam.user.model.allowedAssetExternalProviders')"
            multiple
            clearable
            data-cy="user-allowed-asset-external-providers"
          />
        </ARow>
        <ARow>
          <DistributionServiceSelect
            v-model="userUpdate.allowedDistributionServices"
            :label="t('coreDam.user.model.allowedDistributionServices')"
            multiple
            clearable
            data-cy="user-allowed-distribution-services"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
