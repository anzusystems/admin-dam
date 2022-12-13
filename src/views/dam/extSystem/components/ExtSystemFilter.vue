<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { useExtSystemFilter } from '@/model/dam/filter/ExtSystemFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useExtSystemFilter()

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
        <VCol cols="1">
          <AFilterInteger v-model="filter.id"></AFilterInteger>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.slug"></AFilterString>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.name"></AFilterString>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
