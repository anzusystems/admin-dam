<script lang="ts" setup>
import {
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  DamExtSystemRemoteAutocomplete,
} from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import AssetLicenceByExtSystemRemoteAutocomplete from '@/domains/coreDam/assetLicence/components/AssetLicenceByExtSystemRemoteAutocomplete.vue'
import AssetLicenceGroupByExtSystemRemoteAutocomplete from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupByExtSystemRemoteAutocomplete.vue'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { useAssetListViewFormOptions } from '@/domains/coreDam/assetListView/composables/assetListViewFormOptions'
import { useAssetListViewValidation } from '@/domains/coreDam/assetListView/composables/assetListViewValidation'

const assetListView = defineModel<AssetListView>({ required: true })

const { v$ } = useAssetListViewValidation(assetListView)
const { groupLicenceOptions, uploadLicenceOptions, targetedByGroups } = useAssetListViewFormOptions(assetListView)

const { t } = useI18n()

const onExtSystemChange = () => {
  assetListView.value.groups = []
  assetListView.value.licences = []
}
</script>

<template>
  <ARow>
    <AFormTextField
      v-model="assetListView.name"
      :label="t('coreDam.assetListView.model.name')"
      :v="v$.assetListView.name"
      required
      data-cy="asset-list-view-name"
    />
  </ARow>
  <ARow>
    <DamExtSystemRemoteAutocomplete
      v-model="assetListView.extSystem"
      :client="damClient"
      :label="t('coreDam.assetListView.model.extSystem')"
      :v="v$.assetListView.extSystem"
      data-cy="asset-list-view-ext-system"
      @update:model-value="onExtSystemChange"
    />
  </ARow>
  <ARow>
    <AssetLicenceGroupByExtSystemRemoteAutocomplete
      v-model="assetListView.groups"
      :ext-system-id="assetListView.extSystem"
      :label="t('coreDam.assetListView.model.groups')"
      :hint="t('coreDam.assetListView.model.groupsHint')"
      persistent-hint
      data-cy="asset-list-view-groups"
    />
  </ARow>
  <ARow>
    <AFormValueObjectOptionsSelect
      v-if="targetedByGroups"
      v-model="assetListView.licences"
      :label="t('coreDam.assetListView.model.licences')"
      :hint="t('coreDam.assetListView.model.licencesHint')"
      persistent-hint
      :items="groupLicenceOptions"
      :v="v$.assetListView.licences"
      multiple
      required
      data-cy="asset-list-view-licences"
    />
    <AssetLicenceByExtSystemRemoteAutocomplete
      v-else
      v-model="assetListView.licences"
      :label="t('coreDam.assetListView.model.licences')"
      :hint="t('coreDam.assetListView.model.licencesHint')"
      persistent-hint
      :ext-system-id="assetListView.extSystem"
      :v="v$.assetListView.licences"
      multiple
      required
      data-cy="asset-list-view-licences"
    />
  </ARow>
  <ARow>
    <AFormValueObjectOptionsSelect
      v-model="assetListView.uploadLicence"
      :label="t('coreDam.assetListView.model.uploadLicence')"
      :items="uploadLicenceOptions"
      clearable
      data-cy="asset-list-view-upload-licence"
    />
  </ARow>
  <ARow>
    <AFormTextField
      v-model="assetListView.position"
      :label="t('coreDam.assetListView.model.position')"
      type="number"
      data-cy="asset-list-view-position"
    />
  </ARow>
</template>
