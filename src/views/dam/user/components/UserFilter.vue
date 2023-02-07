<script lang="ts" setup>
import { useUserListFilter } from '@/model/dam/filter/UserFilter'
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterString from '@/components/filter/AFilterString.vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const userFilter = useUserListFilter()

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
          <AFilterInteger v-model="userFilter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="userFilter.email" />
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
