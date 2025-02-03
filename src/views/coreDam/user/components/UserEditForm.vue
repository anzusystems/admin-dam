<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { damClient } from '@/services/api/clients/damClient'
import { ENTITY } from '@/services/api/coreDam/userApi'
import { useUserEditActions } from '@/views/coreDam/user/composables/userActions'
import { useUpdateUserValidation } from '@/views/coreDam/user/composables/userValidation'
import {
  AFormTextField,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceGroupRemoteAutocomplete,
  DamAssetLicenceRemoteAutocomplete,
  DamDistributionServiceSelect,
  DamExternalProviderAssetSelect,
  DamExtSystemRemoteAutocomplete,
  isUndefined,
  useDamConfigStore,
  UserAuthType,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const { userUpdate } = useUserEditActions()
const damConfigStore = useDamConfigStore()
const { damPubConfig } = storeToRefs(damConfigStore)

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
          <DamAssetLicenceGroupRemoteAutocomplete
            v-model="userUpdate.licenceGroups"
            :client="damClient"
            :label="t('coreDam.user.model.licenceGroups')"
            multiple
            clearable
            data-cy="user-asset-licence-groups"
          />
        </ARow>
        <ARow>
          <DamAssetLicenceRemoteAutocomplete
            v-model="userUpdate.assetLicences"
            :client="damClient"
            :label="t('coreDam.user.model.assetLicences')"
            multiple
            clearable
            data-cy="user-asset-licences"
          />
        </ARow>
        <ARow>
          <DamExtSystemRemoteAutocomplete
            v-model="userUpdate.adminToExtSystems"
            :client="damClient"
            :label="t('coreDam.user.model.adminToExtSystems')"
            multiple
            clearable
            data-cy="user-admin-to-ext-systems"
          />
        </ARow>
        <ARow>
          <DamExtSystemRemoteAutocomplete
            v-model="userUpdate.userToExtSystems"
            :client="damClient"
            :label="t('coreDam.user.model.userToExtSystems')"
            multiple
            clearable
            data-cy="user-user-to-ext-systems"
          />
        </ARow>
        <ARow>
          <DamExternalProviderAssetSelect
            v-model="userUpdate.allowedAssetExternalProviders"
            :client="damClient"
            :label="t('coreDam.user.model.allowedAssetExternalProviders')"
            multiple
            clearable
            data-cy="user-allowed-asset-external-providers"
          />
        </ARow>
        <ARow>
          <DamDistributionServiceSelect
            v-model="userUpdate.allowedDistributionServices"
            :client="damClient"
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
