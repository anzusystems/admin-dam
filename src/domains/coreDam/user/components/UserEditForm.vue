<script lang="ts" setup>
import {
  ADamAssetLicenceGroupRemoteAutocomplete,
  ADamAssetLicenceRemoteAutocomplete,
  ADamDistributionServiceSelect,
  ADamExtSystemRemoteAutocomplete,
  ADamExternalProviderAssetSelect,
  AFormTextField,
  ARow,
  ASystemEntityScope,
  UserAuthType,
  isUndefined,
  useDamConfigStore,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { ENTITY } from '@/domains/coreDam/user/api/userApi'
import { useUserEditActions } from '@/domains/coreDam/user/composables/userActions'
import { useUpdateUserValidation } from '@/domains/coreDam/user/composables/userValidation'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

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
          <ADamAssetLicenceGroupRemoteAutocomplete
            v-model="userUpdate.licenceGroups"
            :client="damClient"
            :label="t('coreDam.user.model.licenceGroups')"
            multiple
            clearable
            data-cy="user-asset-licence-groups"
          />
        </ARow>
        <ARow>
          <ADamAssetLicenceRemoteAutocomplete
            v-model="userUpdate.assetLicences"
            :client="damClient"
            :label="t('coreDam.user.model.assetLicences')"
            multiple
            clearable
            data-cy="user-asset-licences"
          />
        </ARow>
        <ARow>
          <ADamExtSystemRemoteAutocomplete
            v-model="userUpdate.adminToExtSystems"
            :client="damClient"
            :label="t('coreDam.user.model.adminToExtSystems')"
            multiple
            clearable
            data-cy="user-admin-to-ext-systems"
          />
        </ARow>
        <ARow>
          <ADamExtSystemRemoteAutocomplete
            v-model="userUpdate.userToExtSystems"
            :client="damClient"
            :label="t('coreDam.user.model.userToExtSystems')"
            multiple
            clearable
            data-cy="user-user-to-ext-systems"
          />
        </ARow>
        <ARow>
          <ADamExternalProviderAssetSelect
            v-model="userUpdate.allowedAssetExternalProviders"
            :client="damClient"
            :label="t('coreDam.user.model.allowedAssetExternalProviders')"
            multiple
            clearable
            data-cy="user-allowed-asset-external-providers"
          />
        </ARow>
        <ARow>
          <ADamDistributionServiceSelect
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
