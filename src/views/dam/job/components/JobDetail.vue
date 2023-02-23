<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useJobOneStore } from '@/stores/dam/jobStore'
import { ABooleanValue, ACard, ADatetime, ARow, JobStatusChip } from '@anzusystems/common-admin'
import { AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { ACopyText } from '@anzusystems/common-admin'
import { computed } from 'vue'
import type { JobResource } from '@/model/dam/valueObject/JobResource'

const { job } = storeToRefs(useJobOneStore())

const { t } = useI18n()

const hasTargetUserId = computed(() => {
  const targetUserIdAwareJobs: JobResource[] = ['jobUserDataDelete']
  return targetUserIdAwareJobs.includes(job.value._resourceName)
})
const hasPodcastFields = computed(() => 'jobPodcastSynchronizer' === job.value._resourceName)
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow v-if="hasTargetUserId" :title="t('job.model.targetUserId')" :value="job.targetUserId" />
        <ARow v-if="'jobUserDataDelete' === job._resourceName" :title="t('job.model.anonymizeUser')">
          <ABooleanValue :value="job.anonymizeUser"></ABooleanValue>
        </ARow>
        <ARow v-if="hasPodcastFields" :title="t('coreDam.job.model.podcastId')" :value="job.podcastId" />
        <ARow v-if="hasPodcastFields" :title="t('coreDam.job.model.fullSync')">
          <ABooleanValue :value="job.fullSync"></ABooleanValue>
        </ARow>
        <ARow :title="t('job.model.startedAt')">
          <ADatetime :date-time="job.startedAt"></ADatetime>
        </ARow>
        <ARow :title="t('job.model.finishedAt')">
          <ADatetime :date-time="job.finishedAt"></ADatetime>
        </ARow>
        <ARow :title="t('job.model.status')">
          <JobStatusChip :value="job.status"></JobStatusChip>
        </ARow>
        <ARow v-if="job.result" :title="t('job.model.result')" :value="job.result"></ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('job.model.id')">
          <ACopyText :value="job.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="job" />
      </ACard>
    </VCol>
  </VRow>
</template>
