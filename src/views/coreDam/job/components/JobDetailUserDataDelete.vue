<script lang="ts" setup>
import { ABooleanValue, AJobDetailCommon, ARow, type JobUserDataDelete, useI18n } from '@anzusystems/common-admin'
import JobResourceChip from '@/views/coreDam/job/components/JobResourceChip.vue'

withDefaults(
  defineProps<{
    job: JobUserDataDelete
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
      <AJobDetailCommon :job="job">
        <template #resource-name>
          <JobResourceChip :value="job._resourceName" />
        </template>
      </AJobDetailCommon>
    </VCol>
    <VCol cols="6">
      <template v-if="!loading">
        <ARow :title="t('common.job.model.targetUserId')">
          {{ job.targetUserId }}
        </ARow>
        <ARow :title="t('common.job.model.anonymizeUser')">
          <ABooleanValue :value="job.anonymizeUser" />
        </ARow>
      </template>
    </VCol>
  </VRow>
</template>
