<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { usePermissionGroupListFilter } from '@/model/common/filter/PermissionGroupFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = usePermissionGroupListFilter()

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
        <VCol cols="12" sm="2">
          <AFilterInteger v-model="filter.id"/>
        </VCol>
        <VCol cols="12" sm="5">
          <AFilterString v-model="filter.title"/>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
