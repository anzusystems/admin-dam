<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, AFormValueObjectOptionsSelect, JOB_RESOURCE_USER_DATA_DELETE } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { JOB_RESOURCE_PODCAST_SYNCHRONIZER, JobResource, useJobResource } from '@/model/coreDam/valueObject/JobResource'
import JobCreateFormPodcastSynchronizer from '@/views/coreDam/job/components/JobCreateFormPodcastSynchronizer.vue'
import JobCreateFormUserDataDelete from '@/views/coreDam/job/components/JobCreateFormUserDataDelete.vue'

withDefaults(
  defineProps<{
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: 'button-create',
  }
)
const emit = defineEmits<{
  (e: 'onSuccess'): void
}>()

const { t } = useI18n()

const selectedType = ref<JobResource>(JOB_RESOURCE_USER_DATA_DELETE)
const dialog = ref(false)
const { jobResourceOptions } = useJobResource()

const jobComponent = computed(() => {
  switch (selectedType.value) {
    case JOB_RESOURCE_USER_DATA_DELETE:
      return JobCreateFormUserDataDelete
    case JOB_RESOURCE_PODCAST_SYNCHRONIZER:
      return JobCreateFormPodcastSynchronizer
    default:
      console.error('Unsupported type.')
      return null
  }
})

const openDialog = () => {
  dialog.value = true
}
const closeDialog = () => {
  dialog.value = false
}
const onSuccess = () => {
  emit('onSuccess')
}
</script>

<template>
  <ABtnPrimary
    :class="buttonClass"
    :data-cy="dataCy"
    rounded="pill"
    @click.stop="openDialog"
  >
    {{ t(buttonT) }}
  </ABtnPrimary>
  <VDialog
    v-model="dialog"
    :max-width="500"
    persistent
  >
    <VCard>
      <ADialogToolbar @on-cancel="closeDialog">
        {{ t('common.job.button.create') }}
      </ADialogToolbar>
      <div class="pa-6">
        <AFormValueObjectOptionsSelect
          v-model="selectedType"
          :items="jobResourceOptions"
          :label="t('common.job.model._resourceName')"
          data-cy="job-select"
        />
      </div>
      <component
        :is="jobComponent"
        @close-dialog="closeDialog"
        @on-success="onSuccess"
      />
    </VCard>
  </VDialog>
</template>
