<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { usePodcastFilter } from '@/model/dam/filter/PodcastFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = usePodcastFilter()

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
        <VCol cols="4">
          <AFilterString v-model="filter.id"></AFilterString>
        </VCol>
        <VCol cols="4">
          <AFilterString v-model="filter.title"></AFilterString>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
