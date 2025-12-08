<script lang="ts" setup>
import type { PodcastExportData } from '@/types/coreDam/PodcastExportData'
import {
  ADialogToolbar,
  AFormValueObjectOptionsSelect,
  useAlerts,
} from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExportTypeTypes } from '@/model/coreDam/valueObject/ExportType'
import { useDeviceTypeTypes } from '@/model/coreDam/valueObject/DeviceType'
import {
  usePodcastExportDataValidation,
} from '@/views/coreDam/podcast/composables/podcastExportDataValidations'
import PodcastExportDataBodyEditor from '@/views/coreDam/podcast/components/PodcastExportDataBodyEditor.vue'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const emit = defineEmits<{
  (e: 'onCancel'): void
}>()

const podcastExportData = defineModel<PodcastExportData>({ required: true })
const podcastExportDataManageDialog = defineModel<boolean>('manageDialog', { required: true })

const { showValidationError } = useAlerts()
const { v$ } = usePodcastExportDataValidation(podcastExportData)
const { t } = useI18n()
const { exportTypeOptions } = useExportTypeTypes()
const { deviceTypeOptions } = useDeviceTypeTypes()

const saveButtonLoading = ref(false)

const onCancel = () => {
  podcastExportDataManageDialog.value = false
  emit('onCancel')
}

const onConfirm = () => {
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  saveButtonLoading.value = false
  podcastExportDataManageDialog.value = false
}
</script>

<template>
  <VDialog
    v-model="podcastExportDataManageDialog"
    :width="900"
    scrollable
  >
    <VCard v-if="podcastExportDataManageDialog">
      <ADialogToolbar @on-cancel="podcastExportDataManageDialog = false">
        <span v-if="podcastExportData.id">{{ t('coreDam.podcastExportData.meta.edit') }}</span>
        <span v-else>{{ t('coreDam.podcastExportData.meta.create') }}</span>
      </ADialogToolbar>
      <VCardText>
        <VRow>
          <VCol cols="12">
            <VRow>
              <AFormValueObjectOptionsSelect
                v-model="podcastExportData.exportType"
                :label="t('coreDam.podcastExportData.model.exportType')"
                :items="exportTypeOptions"
                :v="v$.podcastExportData.exportType"
                :readonly="readonly"
                data-cy="podcast-export-data-export-type"
              />
            </VRow>
            <VRow>
              <AFormValueObjectOptionsSelect
                v-model="podcastExportData.deviceType"
                :label="t('coreDam.podcastExportData.model.deviceType')"
                :items="deviceTypeOptions"
                :v="v$.podcastExportData.deviceType"
                :readonly="readonly"
                data-cy="podcast-export-data-device-type"
              />
            </VRow>
            <VRow>
              <PodcastExportDataBodyEditor
                v-model="podcastExportData.body"
                :label="t('coreDam.podcastExportData.model.body')"
                :editable="!readonly"
              />
            </VRow>
          </VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary @click.stop="onConfirm">
          {{ podcastExportData.id ? t('common.button.confirm') : t('common.button.create') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
