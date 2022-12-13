<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { usePodcastEpisodeFilter } from '@/model/dam/filter/PodcastEpisodeFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = usePodcastEpisodeFilter()

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
