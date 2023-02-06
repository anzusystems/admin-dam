<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/userApi'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { useUserEditActions } from '@/views/dam/user/composables/userActions'
import { useI18n } from 'vue-i18n'
import { useUpdateUserValidation } from '@/views/dam/user/composables/userValidation'
import ARow from '@/components/common/ARow.vue'
import ATextField from '@/components/form/ATextField.vue'
import ExtSystemSelect from '@/views/dam/extSystem/components/ExtSystemSelect.vue'
import DistributionServiceSelect from '@/views/dam/distribution/components/DistributionServiceSelect.vue'
import ExternalProviderAssetSelect from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetSelect.vue'
import AssetLicenceSelect from '@/views/dam/assetLicence/components/AssetLicenceSelect.vue'
import { damPubConfig } from '@/services/DamConfigService'
import { UserAuthType } from '@/types/dam/DamConfig'

const { userUpdate } = useUserEditActions()

const { v$ } = useUpdateUserValidation(userUpdate, damPubConfig.userAuthType)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField v-model="userUpdate.firstName" :v="v$.userUpdate.firstName"></ATextField>
        </ARow>
        <ARow>
          <ATextField v-model="userUpdate.lastName" :v="v$.userUpdate.lastName"></ATextField>
        </ARow>
        <ARow v-if="damPubConfig.userAuthType === UserAuthType.JsonCredentials">
          <ATextField
            v-model="userUpdate.plainPassword"
            :v="v$.userUpdate.plainPassword"
            type="password"
            data-cy="user-plain-password"
          ></ATextField>
        </ARow>
        <ARow>
          <AssetLicenceSelect
            :label="t('coreDam.user.model.assetLicences')"
            v-model="userUpdate.assetLicences"
            :v="v$.userUpdate.assetLicences"
            multiple
            data-cy="user-asset-licences"
          ></AssetLicenceSelect>
        </ARow>
        <ARow>
          <ExtSystemSelect
            :label="t('coreDam.user.model.adminToExtSystems')"
            v-model="userUpdate.adminToExtSystems"
            multiple
            data-cy="user-admin-to-ext-systems"
          ></ExtSystemSelect>
        </ARow>
        <ARow>
          <ExternalProviderAssetSelect
            :label="t('coreDam.user.model.allowedAssetExternalProviders')"
            v-model="userUpdate.allowedAssetExternalProviders"
            multiple
            data-cy="user-allowed-asset-external-providers"
          ></ExternalProviderAssetSelect>
        </ARow>
        <ARow>
          <DistributionServiceSelect
            :label="t('coreDam.user.model.allowedDistributionServices')"
            v-model="userUpdate.allowedDistributionServices"
            multiple
            data-cy="user-allowed-distribution-services"
          ></DistributionServiceSelect>
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
