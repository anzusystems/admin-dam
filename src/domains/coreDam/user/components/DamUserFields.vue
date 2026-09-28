<script lang="ts" setup>
import {
  ADamAssetLicenceGroupRemoteAutocomplete,
  ADamAssetLicenceRemoteAutocomplete,
  ADamDistributionServiceSelect,
  ADamExtSystemRemoteAutocomplete,
  ADamExternalProviderAssetSelect,
  ARow,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

import type { DamUser } from '@/domains/system/descriptors/userSystemDescriptor'
import { damClient } from '@/shared/apiClients/damClient'

defineProps<{
  readonly?: boolean
}>()

const user = defineModel<DamUser>('user', { required: true })

const { t } = useI18n()
</script>

<template>
  <!--
    The dam half of the merged form. It goes into the shared form's `#systemFields` slot, so both
    halves are saved by one `PUT /adm/users/{id}` -- the endpoint takes `DamUserDto`, which is
    `UserDto` plus exactly these fields.

    "Nové heslo" is deliberately gone: no PHP in `core-dam` or `core-dam-bundle` accepts
    `plainPassword`, and the endpoint drops unknown keys, so whatever was typed there was never
    written anywhere.
  -->
  <ARow>
    <ADamAssetLicenceGroupRemoteAutocomplete
      v-model="user.licenceGroups"
      :client="damClient"
      :label="t('coreDam.user.model.licenceGroups')"
      :readonly="readonly"
      multiple
      :clearable="!readonly"
      data-cy="user-asset-licence-groups"
    />
  </ARow>
  <ARow>
    <ADamAssetLicenceRemoteAutocomplete
      v-model="user.assetLicences"
      :client="damClient"
      :label="t('coreDam.user.model.assetLicences')"
      :readonly="readonly"
      multiple
      :clearable="!readonly"
      data-cy="user-asset-licences"
    />
  </ARow>
  <ARow>
    <ADamExtSystemRemoteAutocomplete
      v-model="user.adminToExtSystems"
      :client="damClient"
      :label="t('coreDam.user.model.adminToExtSystems')"
      :readonly="readonly"
      multiple
      :clearable="!readonly"
      data-cy="user-admin-to-ext-systems"
    />
  </ARow>
  <ARow>
    <ADamExtSystemRemoteAutocomplete
      v-model="user.userToExtSystems"
      :client="damClient"
      :label="t('coreDam.user.model.userToExtSystems')"
      :readonly="readonly"
      multiple
      :clearable="!readonly"
      data-cy="user-user-to-ext-systems"
    />
  </ARow>
  <ARow>
    <ADamExternalProviderAssetSelect
      v-model="user.allowedAssetExternalProviders"
      :client="damClient"
      :label="t('coreDam.user.model.allowedAssetExternalProviders')"
      :readonly="readonly"
      multiple
      :clearable="!readonly"
      data-cy="user-allowed-asset-external-providers"
    />
  </ARow>
  <ARow>
    <ADamDistributionServiceSelect
      v-model="user.allowedDistributionServices"
      :client="damClient"
      :label="t('coreDam.user.model.allowedDistributionServices')"
      :readonly="readonly"
      multiple
      :clearable="!readonly"
      data-cy="user-allowed-distribution-services"
    />
  </ARow>
</template>
