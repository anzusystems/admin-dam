<script lang="ts" setup>
import { AFilterBooleanGroup, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'
import { useKeywordListFilter } from '@/model/dam/filter/KeywordFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useKeywordListFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="2">
          <AFilterString v-model="filter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.text" />
        </VCol>
        <VCol cols="2">
          <AFilterBooleanGroup v-model="filter.reviewed" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
