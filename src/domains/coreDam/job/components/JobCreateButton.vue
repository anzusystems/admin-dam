<script lang="ts" setup>
import { ADialogToolbar, AFormValueObjectOptionsSelect, JOB_RESOURCE_USER_DATA_DELETE } from '@anzusystems/common-admin'
import {
  JOB_AUTHOR_CURRENT_OPTIMIZE,
  JOB_RESOURCE_ASSET_FILE_REPROCESS_INTERNAL_FLAG,
  JOB_RESOURCE_PODCAST_SYNCHRONIZER,
  JOB_RESOURCE_SYNCHRONIZE_IMAGE_CHANGED,
  type JobResource,
  useJobResource,
} from '@/domains/coreDam/job/valueObject/JobResource'
import JobCreateFormPodcastSynchronizer from '@/domains/coreDam/job/components/JobCreateFormPodcastSynchronizer.vue'
import JobCreateFormUserDataDelete from '@/domains/coreDam/job/components/JobCreateFormUserDataDelete.vue'
import JobCreateFormDefault from '@/domains/coreDam/job/components/JobCreateFormDefault.vue'
import JobCreateFormAuthorCurrentOptimize from '@/domains/coreDam/job/components/JobCreateFormAuthorCurrentOptimize.vue'
import JobCreateFormAssetFileReprocessInternalFlag from '@/domains/coreDam/job/components/JobCreateFormAssetFileReprocessInternalFlag.vue'
import JobCreateFormSynchronizeImageChanged from '@/domains/coreDam/job/components/JobCreateFormSynchronizeImageChanged.vue'

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
    case JOB_AUTHOR_CURRENT_OPTIMIZE:
      return JobCreateFormAuthorCurrentOptimize
    case JOB_RESOURCE_ASSET_FILE_REPROCESS_INTERNAL_FLAG:
      return JobCreateFormAssetFileReprocessInternalFlag
    case JOB_RESOURCE_SYNCHRONIZE_IMAGE_CHANGED:
      return JobCreateFormSynchronizeImageChanged
    default:
      console.error('Unsupported type.')
      return JobCreateFormDefault
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
