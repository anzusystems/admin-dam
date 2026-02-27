<script lang="ts" setup>
import { AFormDatetimePicker, AFormTextField, ARow, useAlerts, useJobApi, useValidate } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { JobSynchronizeImageChanged } from '@/types/coreDam/Job'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useJobFactory } from '@/model/coreDam/factory/JobFactory'
import useVuelidate from '@vuelidate/core'

const emit = defineEmits<{
  (e: 'onSuccess'): void
  (e: 'closeDialog'): void
}>()

const buttonLoading = ref(false)
const { createSynchronizeImageChanged } = useJobFactory()
const job = ref<JobSynchronizeImageChanged>(createSynchronizeImageChanged())

const { t } = useI18n()

const onCancel = () => {
  emit('closeDialog')
}

const { createJob } = useJobApi<JobSynchronizeImageChanged>(damClient, SYSTEM_CORE_DAM)
const { showRecordWas, showErrorsDefault, showValidationError } = useAlerts()

const { required, minValue, maxValue } = useValidate()

const rules = {
  job: {
    targetLicenceId: {
      required,
    },
    bulkSize: {
      required,
      minValue: minValue(10),
      maxValue: maxValue(1000),
    },
  },
}

const v$ = useVuelidate(rules, { job })

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    await createJob(job.value)
    showRecordWas('created')
    emit('onSuccess')
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
    emit('closeDialog')
  }
}
</script>

<template>
  <VCardText>
    <ARow>
      <AFormTextField
        v-model="job.targetLicenceId"
        :label="t('coreDam.job.model.targetLicenceId')"
        data-cy="targetLicenceId"
        required
      />
    </ARow>
    <ARow>
      <AFormDatetimePicker
        v-model="job.processFrom"
        :label="t('coreDam.job.model.processFrom')"
        clearable
        data-cy="processFrom"
      />
    </ARow>
    <ARow>
      <AFormTextField
        v-model="job.bulkSize"
        :label="t('coreDam.job.model.bulkSize')"
        data-cy="bulkSize"
        required
      />
    </ARow>
  </VCardText>
  <VCardActions>
    <VSpacer />
    <ABtnTertiary @click.stop="onCancel">
      {{ t('common.button.cancel') }}
    </ABtnTertiary>
    <ABtnPrimary
      :loading="buttonLoading"
      @click.stop="onConfirm"
    >
      {{ t('common.button.create') }}
    </ABtnPrimary>
  </VCardActions>
</template>
