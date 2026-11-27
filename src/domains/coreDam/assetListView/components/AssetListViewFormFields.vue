<script lang="ts" setup>
import {
  ADamAssetLicenceGroupRemoteAutocomplete,
  ADamAssetLicenceRemoteAutocomplete,
  ADamExtSystemRemoteAutocomplete,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  isNull,
} from '@anzusystems/common-admin'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useAssetListViewValidation } from '@/domains/coreDam/assetListView/composables/assetListViewValidation'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { damClient } from '@/shared/apiClients/damClient'

const assetListView = defineModel<AssetListView>({ required: true })

const { v$ } = useAssetListViewValidation(assetListView)

const { t } = useI18n()

const onExtSystemChange = () => {
  assetListView.value.groups = []
  assetListView.value.licences = []
}

const { addToCachedAssetLicences, fetchCachedAssetLicences, getCachedAssetLicence } = useCachedAssetLicences()

const uploadLicenceItems = computed(() =>
  assetListView.value.licences.map((id) => ({ value: id, title: getCachedAssetLicence(id)?.name || String(id) }))
)

// The upload licence is one of the view's licences (AssetListViewValidator in core-dam-bundle).
watch(
  () => assetListView.value.licences,
  (licences) => {
    addToCachedAssetLicences(licences)
    fetchCachedAssetLicences()
    if (!isNull(assetListView.value.uploadLicence) && !licences.includes(assetListView.value.uploadLicence)) {
      assetListView.value.uploadLicence = null
    }
  },
  { immediate: true }
)
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
    <ADamExtSystemRemoteAutocomplete
      v-model="assetListView.extSystem"
      :client="damClient"
      :label="t('coreDam.assetListView.model.extSystem')"
      :v="v$.assetListView.extSystem"
      data-cy="asset-list-view-ext-system"
      @update:model-value="onExtSystemChange"
    />
  </ARow>
  <ARow>
    <ADamAssetLicenceGroupRemoteAutocomplete
      v-model="assetListView.groups"
      :client="damClient"
      :disabled="!assetListView.extSystem"
      multiple
      :ext-system-id="assetListView.extSystem"
      :label="t('coreDam.assetListView.model.groups')"
      :hint="t('coreDam.assetListView.model.groupsHint')"
      persistent-hint
      data-cy="asset-list-view-groups"
    />
  </ARow>
  <ARow>
    <ADamAssetLicenceRemoteAutocomplete
      v-model="assetListView.licences"
      :client="damClient"
      :disabled="!assetListView.extSystem"
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
      :items="uploadLicenceItems"
      :label="t('coreDam.assetListView.model.uploadLicence')"
      clearable
      data-cy="asset-list-view-upload-licence"
    />
  </ARow>
  <ARow>
    <AFormTextField
      v-model.number="assetListView.position"
      :label="t('coreDam.assetListView.model.position')"
      :v="v$.assetListView.position"
      type="number"
      data-cy="asset-list-view-position"
    />
  </ARow>
</template>
