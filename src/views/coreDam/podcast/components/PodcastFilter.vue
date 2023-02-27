<script lang="ts" setup>
import { AFilterString, AFilterWrapper } from '@anzusystems/common-admin'
import { usePodcastListFilter } from '@/model/coreDam/filter/PodcastFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = usePodcastListFilter()

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
        <VCol cols="4">
          <AFilterString v-model="filter.id" />
        </VCol>
        <VCol cols="4">
          <AFilterString v-model="filter.title" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
