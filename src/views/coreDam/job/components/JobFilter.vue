<script lang="ts" setup>
import { useJobListFilter } from '@/model/coreDam/filter/JobFilter'
import {
  AFilterDatetimePicker,
  AFilterInteger,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  useJobStatus,
} from '@anzusystems/common-admin'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useJobListFilter()
const touched = ref(false)

const submitFilter = () => {
  touched.value = false
  emit('submitFilter')
}

const resetFilter = () => {
  touched.value = false
  emit('resetFilter')
}

const onAnyFilterUpdate = () => {
  touched.value = true
}

const { jobStatusOptions } = useJobStatus()
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <AFilterWrapper
      :touched="touched"
      @reset-filter="resetFilter"
    >
      <VRow align="start">
        <VCol
          cols="12"
          sm="3"
        >
          <AFilterInteger
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="3"
        >
          <AFilterValueObjectOptionsSelect
            v-model="filter.status"
            :items="jobStatusOptions"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="3"
        >
          <AFilterDatetimePicker
            v-model="filter.startedAtFrom"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="3"
        >
          <AFilterDatetimePicker
            v-model="filter.startedAtUntil"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
