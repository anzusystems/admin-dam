<script lang="ts" setup>
import { useJobListFilter } from '@/model/dam/filter/JobFilter'
import { AFilterValueObjectOptionsSelect, AFilterWrapper, useJobStatus } from '@anzusystems/common-admin'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterDatetime from '@/components/filter/AFilterDatetime.vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useJobListFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}

const { jobStatusOptions } = useJobStatus()
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="12" sm="3">
          <AFilterInteger v-model="filter.id" />
        </VCol>
        <VCol cols="12" sm="3">
          <AFilterValueObjectOptionsSelect v-model="filter.status" :items="jobStatusOptions" />
        </VCol>
        <VCol cols="12" sm="3">
          <AFilterDatetime v-model="filter.startedAtFrom" />
        </VCol>
        <VCol cols="12" sm="3">
          <AFilterDatetime v-model="filter.startedAtUntil" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
