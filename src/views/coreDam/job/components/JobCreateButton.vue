<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  AFormBooleanToggle,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
  useJobApi,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useJobFactory } from '@/model/coreDam/factory/JobFactory'
import type { Job } from '@/types/coreDam/Job'
import { useJobValidation } from '@/views/coreDam/job/composables/jobValidations'
import { damClient } from '@/services/api/clients/damClient'
import { type JobResource, useJobResource } from '@/model/coreDam/valueObject/JobResource'

const props = withDefaults(
  defineProps<{
    disableRedirect?: boolean
    buttonT?: string
    buttonClass?: string
    dataCy?: string
    disabled?: boolean | undefined
  }>(),
  {
    disableRedirect: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
    disabled: undefined,
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: Job): void
}>()

const { createDefault } = useJobFactory()
const job = ref<Job>(createDefault())
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  job.value = createDefault()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useJobValidation(job)
const { t } = useI18n()
const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { createJob } = useJobApi<Job>(damClient, SYSTEM_CORE_DAM)

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    const res = await createJob(job.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.JOB.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}

const { jobResourceOptions } = useJobResource()

const hasTargetUserId = computed(() => {
  const targetUserIdAwareJobs: JobResource[] = ['jobUserDataDelete']
  return targetUserIdAwareJobs.includes(job.value._resourceName)
})
const hasPodcastFields = computed(() => 'jobPodcastSynchronizer' === job.value._resourceName)
</script>

<template>
  <VBtn
    :class="buttonClass"
    :data-cy="dataCy"
    color="success"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('common.job.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" subject="job">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="job._resourceName"
              :label="t('common.job.model._resourceName')"
              :items="jobResourceOptions"
              :v="v$.job._resourceName"
              data-cy="job-select"
            />
          </ARow>
          <ARow v-if="hasTargetUserId">
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
          <ARow v-if="hasPodcastFields">
            <AFormTextField
              v-model="job.podcastId"
              :label="t('coreDam.job.model.podcastId')"
              :v="v$.job.podcastId"
              data-cy="podcastId"
            />
          </ARow>
          <ARow v-if="hasPodcastFields">
            <AFormBooleanToggle v-model="job.fullSync" :label="t('coreDam.job.model.fullSync')" data-cy="fullSync" />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-create-podcast" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
