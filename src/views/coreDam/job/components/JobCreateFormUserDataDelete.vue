<script lang="ts" setup>
import {
  AFormBooleanToggle,
  AFormTextField,
  ARow,
  type JobUserDataDelete,
  useAlerts,
  useCommonJobFactory,
  useJobApi,
  useValidate,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import useVuelidate from '@vuelidate/core'

const emit = defineEmits<{
  (e: 'onSuccess'): void
  (e: 'closeDialog'): void
}>()

const buttonLoading = ref(false)
const { createUserDataDelete } = useCommonJobFactory()
const job = ref<JobUserDataDelete>(createUserDataDelete(SYSTEM_CORE_DAM))

const { t } = useI18n()

const onCancel = () => {
  emit('closeDialog')
}

const { createJob } = useJobApi<JobUserDataDelete>(damClient, SYSTEM_CORE_DAM)
const { showRecordWas, showErrorsDefault, showValidationError } = useAlerts()

const { required, minValue } = useValidate()

const rules = {
  job: {
    targetUserId: {
      required,
      minValue: minValue(1),
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
        v-model.number="job.targetUserId"
        :label="t('common.job.model.targetUserId')"
        :v="v$.job.targetUserId"
        data-cy="targetUser"
      />
    </ARow>
    <ARow v-if="'jobUserDataDelete' === job._resourceName">
      <AFormBooleanToggle
        v-model="job.anonymizeUser"
        :label="t('common.job.model.anonymizeUser')"
        data-cy="anonymizeUser"
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
