<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ACreateDialog, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import ExtSystemRemoteAutocomplete from '@/views/coreDam/extSystem/components/ExtSystemRemoteAutocomplete.vue'
import { useAssetLicenceFactory } from '@/model/coreDam/factory/AssetLicenceFactory'
import type { DamAssetLicence } from '@anzusystems/common-admin'
import { useAssetLicenceValidation } from '@/views/coreDam/assetLicence/composables/assetLicenceValidation'
import { createAssetLicence, ENTITY } from '@/services/api/coreDam/assetLicenceApi'

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
  (e: 'onSuccess', data: DamAssetLicence): void
}>()

const { createDefault } = useAssetLicenceFactory()
const assetLicence = ref<DamAssetLicence>(createDefault())
const dialog = ref(false)

const { v$ } = useAssetLicenceValidation(assetLicence)
const { t } = useI18n()

const onOpen = () => {
  assetLicence.value = createDefault()
}

const create = async () => {
  return await createAssetLicence(assetLicence.value)
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
  >
    <template #title>
      {{ t('coreDam.assetLicence.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="assetLicence.name"
            :label="t('coreDam.assetLicence.model.name')"
            :v="v$.assetLicence.name"
            required
            data-cy="asset-licence-name"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="assetLicence.extId"
            :label="t('coreDam.assetLicence.model.extId')"
            :v="v$.assetLicence.extId"
            required
            data-cy="asset-licence-ext-id"
          />
        </ARow>
        <ARow>
          <ExtSystemRemoteAutocomplete
            v-model="assetLicence.extSystem"
            :label="t('coreDam.assetLicence.model.extSystem')"
            required
            data-cy="asset-licence-ext-system"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
