<script lang="ts" setup>
import {
  ADamAssetLicenceRemoteAutocomplete,
  ADamExtSystemRemoteAutocomplete,
  AFormTextField,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

import { ENTITY } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import { useAssetLicenceGroupEditActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import { useAssetLicenceGroupValidation } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupValidation'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const { assetLicenceGroup } = useAssetLicenceGroupEditActions()

const { v$ } = useAssetLicenceGroupValidation(assetLicenceGroup)

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
            v-model="assetLicenceGroup.name"
            :label="t('coreDam.assetLicenceGroup.model.name')"
            :v="v$.assetLicenceGroup.name"
            data-cy="asset-licence-group-name"
          />
        </ARow>
        <ARow>
          <ADamExtSystemRemoteAutocomplete
            v-model="assetLicenceGroup.extSystem"
            :client="damClient"
            :label="t('coreDam.assetLicenceGroup.model.extSystem')"
            :v="v$.assetLicenceGroup.extSystem"
            data-cy="asset-licence-group-ext-system"
            @update:model-value="assetLicenceGroup.licences = []"
          />
        </ARow>
        <ARow>
          <ADamAssetLicenceRemoteAutocomplete
            v-model="assetLicenceGroup.licences"
            :client="damClient"
            :label="t('coreDam.assetLicenceGroup.model.licences')"
            :ext-system-id="assetLicenceGroup.extSystem"
            hide-details
            multiple
            required
            data-cy="asset-licence-group-licences"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
