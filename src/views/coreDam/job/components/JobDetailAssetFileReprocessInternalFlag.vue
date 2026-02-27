<script lang="ts" setup>
import { AJobDetailCommon, ARow, useI18n } from '@anzusystems/common-admin'
import type { JobAssetFileReprocessInternalFlag } from '@/types/coreDam/Job'
import JobResourceChip from '@/views/coreDam/job/components/JobResourceChip.vue'

withDefaults(
  defineProps<{
    job: JobAssetFileReprocessInternalFlag
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
          {{ job.processFrom }}
        </ARow>
        <ARow :title="t('coreDam.job.model.bulkSize')">
          {{ job.bulkSize }}
        </ARow>
      </template>
    </VCol>
  </VRow>
</template>
