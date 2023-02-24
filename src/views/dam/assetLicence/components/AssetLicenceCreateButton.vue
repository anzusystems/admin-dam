<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AFormTextField,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
  useErrorHandler,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import ExtSystemSelect from '@/views/dam/extSystem/components/ExtSystemSelect.vue'
import { useAssetLicenceFactory } from '@/model/dam/factory/AssetLicenceFactory'
import type { AssetLicence } from '@/types/dam/AssetLicence'
import { useAssetLicenceValidation } from '@/views/dam/assetLicence/composables/assetLicenceValidation'
import { createAssetLicence, ENTITY } from '@/services/api/dam/assetLicenceApi'

const props = withDefaults(
  defineProps<{
    disableRedirect?: boolean
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    disableRedirect: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: AssetLicence): void
}>()

const { createDefault } = useAssetLicenceFactory()
const assetLicence = ref<AssetLicence>(createDefault())
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  assetLicence.value = createDefault()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useAssetLicenceValidation(assetLicence)
const { t } = useI18n()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    const res = await createAssetLicence(assetLicence.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.ASSET_LICENCE.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <VBtn :class="buttonClass" :data-cy="dataCy" color="success" rounded="pill" @click.stop="onClick">
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent no-click-animation>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.assetLicence.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
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
            <ExtSystemSelect
              v-model="assetLicence.extSystem"
              :label="t('coreDam.assetLicence.model.extSystem')"
              required
              data-cy="asset-licence-ext-system"
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-confirm" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
