<script lang="ts" setup>
import { AFormTextField, ARow, useAlerts, useJobApi, useValidate } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { JobPodcastSynchronizer } from '@/types/coreDam/Job'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useJobFactory } from '@/model/coreDam/factory/JobFactory'
import useVuelidate from '@vuelidate/core'

const emit = defineEmits<{
  (e: 'onSuccess'): void
  (e: 'closeDialog'): void
}>()

const buttonLoading = ref(false)
const { createPodcastSynchronizer } = useJobFactory()
const job = ref<JobPodcastSynchronizer>(createPodcastSynchronizer())

const { t } = useI18n()

const onCancel = () => {
  emit('closeDialog')
}

const { createJob } = useJobApi<JobPodcastSynchronizer>(damClient, SYSTEM_CORE_DAM)
const { showRecordWas, showErrorsDefault, showValidationError } = useAlerts()

const { required } = useValidate()

const rules = {
  job: {
    podcastId: {
      required,
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
        v-model="job.podcastId"
        :label="t('coreDam.job.model.podcastId')"
        data-cy="podcastId"
        required
      />
    </ARow>
    <ARow>
      <VSwitch
        v-model="job.fullSync"
        :label="t('coreDam.job.model.fullSync')"
        data-cy="fullSync"
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
