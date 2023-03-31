<script lang="ts" setup>
import { ADatetime, AJobStatusChip, ARow, type JobBase, useI18n } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    job: JobBase
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const { t } = useI18n()
</script>

<template>
  <div>
    <ARow
      :title="t('common.job.model.id')"
      :value="job.id"
    />
    <ARow :title="t('common.job.model._resourceName')">
      <slot name="resource-name">
        {{ job._resourceName }}
      </slot>
    </ARow>
    <ARow :title="t('common.job.model.status')">
      <AJobStatusChip :value="job.status" />
    </ARow>
    <ARow :title="t('common.job.model.startedAt')">
      <ADatetime :date-time="job.startedAt" />
    </ARow>
    <ARow :title="t('common.job.model.finishedAt')">
      <ADatetime :date-time="job.finishedAt" />
    </ARow>
    <ARow
      :title="t('common.job.model.result')"
      :value="job.result"
    />
  </div>
</template>
