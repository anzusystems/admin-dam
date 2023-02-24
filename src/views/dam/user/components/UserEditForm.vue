<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/userApi'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useUserEditActions } from '@/views/dam/user/composables/userActions'
import { useI18n } from 'vue-i18n'
import { useUpdateUserValidation } from '@/views/dam/user/composables/userValidation'
import ExtSystemSelect from '@/views/dam/extSystem/components/ExtSystemSelect.vue'
import DistributionServiceSelect from '@/views/dam/distribution/components/DistributionServiceSelect.vue'
import ExternalProviderAssetSelect from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetSelect.vue'
import AssetLicenceSelect from '@/views/dam/assetLicence/components/AssetLicenceSelect.vue'
import { damPubConfig } from '@/services/DamConfigService'
import { UserAuthType } from '@/types/dam/DamConfig'

const { userUpdate } = useUserEditActions()

const { v$ } = useUpdateUserValidation(userUpdate, damPubConfig.userAuthType)

const { t } = useI18n()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <AFormTextField v-model="userUpdate.firstName" :v="v$.userUpdate.firstName" />
        </ARow>
        <ARow>
          <AFormTextField v-model="userUpdate.lastName" :v="v$.userUpdate.lastName" />
        </ARow>
        <ARow v-if="damPubConfig.userAuthType === UserAuthType.JsonCredentials">
          <AFormTextField
            v-model="userUpdate.plainPassword"
            :v="v$.userUpdate.plainPassword"
            type="password"
            data-cy="user-plain-password"
          />
        </ARow>
        <ARow>
          <AssetLicenceSelect
            v-model="userUpdate.assetLicences"
            :label="t('coreDam.user.model.assetLicences')"
            :v="v$.userUpdate.assetLicences"
            multiple
            data-cy="user-asset-licences"
          />
        </ARow>
        <ARow>
          <ExtSystemSelect
            v-model="userUpdate.adminToExtSystems"
            :label="t('coreDam.user.model.adminToExtSystems')"
            multiple
            data-cy="user-admin-to-ext-systems"
          />
        </ARow>
        <ARow>
          <ExternalProviderAssetSelect
            v-model="userUpdate.allowedAssetExternalProviders"
            :label="t('coreDam.user.model.allowedAssetExternalProviders')"
            multiple
            data-cy="user-allowed-asset-external-providers"
          />
        </ARow>
        <ARow>
          <DistributionServiceSelect
            v-model="userUpdate.allowedDistributionServices"
            :label="t('coreDam.user.model.allowedDistributionServices')"
            multiple
            data-cy="user-allowed-distribution-services"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
