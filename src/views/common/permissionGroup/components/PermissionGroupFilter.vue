<script lang="ts" setup>
import { usePermissionGroupListFilter } from '@/model/common/filter/PermissionGroupFilter'
import { AFilterInteger, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'

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
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="12" sm="2">
          <AFilterInteger v-model="filter.id" />
        </VCol>
        <VCol cols="12" sm="5">
          <AFilterString v-model="filter.title" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
