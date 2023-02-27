<script lang="ts" setup>
import { useExtSystemListFilter } from '@/model/coreDam/filter/ExtSystemFilter'
import { AFilterInteger, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useExtSystemListFilter()

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
        <VCol cols="1">
          <AFilterInteger v-model="filter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.slug" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.name" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
