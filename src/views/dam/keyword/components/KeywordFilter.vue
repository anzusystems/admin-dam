<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import AFilterBooleanGroup from '@/components/filter/AFilterBooleanGroup.vue'
import { useKeywordFilter } from '@/model/dam/filter/KeywordFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useKeywordFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <FilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="2">
          <AFilterString v-model="filter.id"></AFilterString>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.text"></AFilterString>
        </VCol>
        <VCol cols="2">
          <AFilterBooleanGroup v-model="filter.reviewed"></AFilterBooleanGroup>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
