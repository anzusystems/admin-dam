<script lang="ts" setup>
import { AJobDetailCommon, ARow, dateTimePretty, useI18n } from '@anzusystems/common-admin'
import type { JobSynchronizeImageChanged } from '@/types/coreDam/Job'
import JobResourceChip from '@/views/coreDam/job/components/JobResourceChip.vue'

withDefaults(
  defineProps<{
    job: JobSynchronizeImageChanged
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
        <ARow :title="t('coreDam.job.model.targetLicenceId')">
          {{ job.targetLicenceId }}
        </ARow>
        <ARow :title="t('coreDam.job.model.processFrom')">
          {{ dateTimePretty(job.processFrom) }}
        </ARow>
        <ARow :title="t('coreDam.job.model.processUntil')">
          {{ dateTimePretty(job.processUntil) }}
        </ARow>
        <ARow :title="t('coreDam.job.model.bulkSize')">
          {{ job.bulkSize }}
        </ARow>
      </template>
    </VCol>
  </VRow>
</template>
