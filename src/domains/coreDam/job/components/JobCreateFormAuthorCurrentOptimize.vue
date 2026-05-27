<script lang="ts" setup>
import { AFormTextField, ARow, useJobApi } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { JobAuthorCurrentOptimize } from '@/domains/coreDam/job/types/Job'
import { useJobFactory } from '@/domains/coreDam/job/factory/JobFactory'

const emit = defineEmits<{
  (e: 'onSuccess'): void
  (e: 'closeDialog'): void
}>()

const buttonLoading = ref(false)
const { createAuthorCurrentOptimize } = useJobFactory()
const job = ref<JobAuthorCurrentOptimize>(createAuthorCurrentOptimize())

const { t } = useI18n()

const onCancel = () => {
  emit('closeDialog')
}

const { createJob } = useJobApi<JobAuthorCurrentOptimize>(damClient, SYSTEM_CORE_DAM)
const { showRecordWas, showErrorsDefault, showValidationError } = useAlerts()

const { required, minValue } = useValidate()

const rules = computed(() => {
  if (!job.value.processAll) {
    return {
      job: {
        authorId: {
          required,
          minValue: minValue(1),
        },
      },
    }
  }
  return { job: {} }
})

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
        v-model="job.authorId"
        :label="t('coreDam.job.model.authorId')"
        data-cy="authorId"
      />
    </ARow>
    <ARow>
      <VSwitch
        v-model="job.processAll"
        :label="t('coreDam.job.model.processAll')"
        data-cy="processAll"
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
