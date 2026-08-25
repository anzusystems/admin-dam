<script lang="ts" setup>
import {
  AFilterTimeInterval,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useLogLevel } from '@anzusystems/common-admin'
import { useLogSystem } from '@/domains/common/log/valueObject/LogSystem'
import { useLogType } from '@/domains/common/log/valueObject/LogType'
import { allowedTimeIntervalValuesSubject } from '@/domains/system/composables/timeInterval'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { logTypeOptions } = useLogType()
const { logLevelOptions } = useLogLevel()
const { logSystemOptions } = useLogSystem()
</script>

<template>
  <AFilterWrapper
    enable-top
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #top>
      <VRow class="align-start">
        <VCol
          class="pb-0"
          cols="12"
          sm="8"
        >
          <AFilterValueObjectOptionsSelect
            name="system"
            :items="logSystemOptions"
          />
        </VCol>
        <VCol
          class="pb-0"
          cols="12"
          sm="4"
        >
          <AFilterValueObjectOptionsSelect
            name="type"
            :items="logTypeOptions"
          />
        </VCol>
      </VRow>
    </template>
    <template #item.levelName>
      <AFilterValueObjectOptionsSelect
        name="levelName"
        :items="logLevelOptions"
      />
    </template>
    <template #item.datetimeFrom>
      <AFilterTimeInterval
        name-from="datetimeFrom"
        name-until="datetimeTo"
        :allowed="allowedTimeIntervalValuesSubject"
      />
    </template>
  </AFilterWrapper>
</template>
