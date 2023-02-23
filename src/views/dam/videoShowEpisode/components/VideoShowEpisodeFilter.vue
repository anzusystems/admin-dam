<script lang="ts" setup>
import { AFilterWrapper, AFilterString } from '@anzusystems/common-admin'
import { useVideoShowEpisodeListFilter } from '@/model/dam/filter/VideoShowEpisodeFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useVideoShowEpisodeListFilter()

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
