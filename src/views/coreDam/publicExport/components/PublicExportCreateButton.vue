<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ACreateDialog,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope, DamAssetLicenceRemoteAutocomplete
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createPublicExport, ENTITY } from '@/services/api/coreDam/publicExportApi'
import { usePublicExportFactory } from '@/model/coreDam/factory/PublicExportFactory'
import type { PublicExport } from '@/types/coreDam/PublicExport'
import {
  usePublicExportValidation
} from '@/views/coreDam/publicExport/composables/publicExportValidation'
import { useExportTypeTypes } from '@/model/coreDam/valueObject/ExportType'
import { damClient } from '@/services/api/clients/damClient'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

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
  (e: 'onSuccess', data: PublicExport): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = usePublicExportFactory()
const publicExport = ref<PublicExport>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

const { v$ } = usePublicExportValidation(publicExport)
const { t } = useI18n()

const onOpen = () => {
  publicExport.value = createDefault(currentExtSystemId.value)
}

const create = async () => {
  return await createPublicExport(publicExport.value)
}

const { exportTypeOptions } = useExportTypeTypes()

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
    <template #button-title>
      {{ t('coreDam.publicExport.button.create') }}
    </template>
    <template #title>
      {{ t('coreDam.publicExport.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="publicExport.slug"
            :label="t('coreDam.publicExport.model.slug')"
            :v="v$.publicExport.slug"
            data-cy="publicExport-slug"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="publicExport.type"
            :label="t('coreDam.publicExport.model.type')"
            :items="exportTypeOptions"
            data-cy="publicExport-type"
          />
        </ARow>
        <ARow>
          <DamAssetLicenceRemoteAutocomplete
            v-model="publicExport.assetLicence"
            :client="damClient"
            :label="t('coreDam.publicExport.model.assetLicence')"
            data-cy="user-asset-licences"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
