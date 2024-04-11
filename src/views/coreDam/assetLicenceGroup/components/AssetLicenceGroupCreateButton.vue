<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ACreateDialog,
  AFormTextField,
  ARow,
  ASystemEntityScope, DamAssetLicenceRemoteAutocomplete,
  DamExtSystemRemoteAutocomplete
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useAssetLicenceGroupFactory } from '@/model/coreDam/factory/AssetLicenceGroupFactory'
import { useAssetLicenceGroupValidation } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupValidation'
import { createAssetLicenceGroup, ENTITY } from '@/services/api/coreDam/assetLicenceGroupApi'
import { damClient } from '@/services/api/clients/damClient'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'

withDefaults(
  defineProps<{
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'onSuccess', data: AssetLicenceGroup): void
}>()

const { createDefault } = useAssetLicenceGroupFactory()
const assetLicenceGroup = ref<AssetLicenceGroup>(createDefault())
const dialog = ref(false)

const { v$ } = useAssetLicenceGroupValidation(assetLicenceGroup)
const { t } = useI18n()

const onOpen = () => {
  assetLicenceGroup.value = createDefault()
}

const create = async () => {
  return await createAssetLicenceGroup(assetLicenceGroup.value)
}
</script>

<template>
  <ACreateDialog
    v-model="dialog"
    :v="v$"
    :call-create="create"
    disable-redirect
    :button-class="buttonClass"
    :data-cy="dataCy"
    :max-width="500"
    @on-open="onOpen"
    @on-success="emit('onSuccess', $event)"
    @on-close="dialog = false"
  >
    <template #title>
      {{ t('coreDam.assetLicenceGroup.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="assetLicenceGroup.name"
            :label="t('coreDam.assetLicenceGroup.model.name')"
            :v="v$.assetLicenceGroup.name"
            required
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
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
