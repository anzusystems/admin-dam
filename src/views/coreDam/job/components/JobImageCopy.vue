<script lang="ts" setup>
import { ABooleanValue, AJobDetailCommon, ARow, useI18n } from '@anzusystems/common-admin'
import type { JobImageCopy, JobImageCopyItem, JobPodcastSynchronizer } from '@/types/coreDam/Job'
import JobResourceChip from '@/views/coreDam/job/components/JobResourceChip.vue'

withDefaults(
  defineProps<{
    job: JobImageCopy
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="6">
      <AJobDetailCommon
        :job="job"
        :loading="loading"
      >
        <template #resource-name>
          <JobResourceChip :value="job._resourceName" />
        </template>
      </AJobDetailCommon>
    </VCol>
    <VCol cols="6">
      <template v-if="!loading">
        <ARow :title="t('coreDam.job.model.licence')">
          {{ job.licence }}
        </ARow>
      </template>
    </VCol>
  </VRow>
</template>
