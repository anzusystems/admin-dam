<script lang="ts" setup>
import {
  AFormTextField,
  ARow, DamDistributionRequirementStrategy,
  type JobUserDataDelete,
  useAlerts,
  useCommonJobFactory,
  useJobApi,
  useValidate,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import useVuelidate from '@vuelidate/core'
import type { JobAuthorCurrentOptimize } from '@/types/coreDam/Job'
import { useJobFactory } from '@/model/coreDam/factory/JobFactory'

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
      authorId: {
        required,
        minValue: minValue(1),
      }
    }
  }
  return {}
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
