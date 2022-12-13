<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'
import { useLogType } from '@/model/common/valueObject/LogType'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import { useLogLevel } from '@/model/common/valueObject/LogLevel'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import { useLogSystem } from '@/model/common/valueObject/LogSystem'
import AFilterDatetime from '@/components/filter/AFilterDatetime.vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const logFilter = useLogFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}

const { logTypeOptions } = useLogType()
const { logLevelOptions } = useLogLevel()
const { logSystemOptions } = useLogSystem()
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <FilterWrapper enable-advanced enable-top @reset-filter="resetFilter">
      <VRow align="start">
        <VCol class="pb-0" cols="12" sm="4">
          <AFilterValueObject v-model="logFilter.levelName" :items="logLevelOptions"></AFilterValueObject>
        </VCol>
        <VCol cols="12" sm="2">
          <AFilterString v-model="logFilter.contextId"></AFilterString>
        </VCol>
        <VCol cols="12" sm="3">
          <AFilterDatetime v-model="logFilter.datetimeFrom" disable-clearable></AFilterDatetime>
        </VCol>
        <VCol cols="12" sm="3">
          <AFilterDatetime v-model="logFilter.datetimeTo" disable-clearable></AFilterDatetime>
        </VCol>
      </VRow>
      <template #top>
        <VRow align="start">
          <VCol class="pb-0" cols="12" sm="8">
            <AFilterValueObject v-model="logFilter.system" :items="logSystemOptions"></AFilterValueObject>
          </VCol>
          <VCol class="pb-0" cols="12" sm="4">
            <AFilterValueObject v-model="logFilter.type" :items="logTypeOptions"></AFilterValueObject>
          </VCol>
        </VRow>
        <VDivider class="mb-4"></VDivider>
      </template>
      <template #advanced>
        <VRow align="start">
          <VCol cols="12" sm="2">
            <AFilterString v-model="logFilter.id"></AFilterString>
          </VCol>
          <VCol cols="12" sm="6">
            <AFilterString v-model="logFilter.message"></AFilterString>
          </VCol>
          <VCol cols="12" sm="2">
            <AFilterString v-model="logFilter.appVersion"></AFilterString>
          </VCol>
          <VCol cols="12" sm="2">
            <AFilterInteger v-model="logFilter.userId"></AFilterInteger>
          </VCol>
        </VRow>
      </template>
    </FilterWrapper>
  </VForm>
</template>
