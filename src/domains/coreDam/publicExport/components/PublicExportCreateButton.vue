<script lang="ts" setup>
import {
  ACreateDialog,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { createPublicExport, ENTITY } from '@/domains/coreDam/publicExport/api/publicExportApi'
import { usePublicExportFactory } from '@/domains/coreDam/publicExport/factory/PublicExportFactory'
import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'
import { usePublicExportValidation } from '@/domains/coreDam/publicExport/composables/publicExportValidation'
import { useExportTypeTypes } from '@/domains/coreDam/asset/valueObject/ExportType'
import { damClient } from '@/shared/apiClients/damClient'

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

const { createDefault } = usePublicExportFactory()
const publicExport = ref<PublicExport>(createDefault())
const dialog = ref(false)

const { v$ } = usePublicExportValidation(publicExport)
const { t } = useI18n()

const onOpen = () => {
  publicExport.value = createDefault()
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
