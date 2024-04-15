<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/assetLicenceGroupApi'
import { useI18n } from 'vue-i18n'
import {
  AFormTextField,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
  DamExtSystemRemoteAutocomplete
} from '@anzusystems/common-admin'
import { useAssetLicenceGroupEditActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import { useAssetLicenceGroupValidation } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupValidation'
import { damClient } from '@/services/api/clients/damClient'

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
          <DamExtSystemRemoteAutocomplete
            v-model="assetLicenceGroup.extSystem"
            :client="damClient"
            :label="t('coreDam.assetLicenceGroup.model.extSystem')"
            :v="v$.assetLicenceGroup.extSystem"
            data-cy="asset-licence-group-ext-system"
            @update:model-value="assetLicenceGroup.licences = []"
          />
        </ARow>
        <ARow>
          <DamAssetLicenceRemoteAutocomplete
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
