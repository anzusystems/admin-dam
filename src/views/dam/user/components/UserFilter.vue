<script lang="ts" setup>
import { useUserListFilter } from '@/model/dam/filter/UserFilter'
import { AFilterInteger, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'

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
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="1">
          <AFilterInteger v-model="userFilter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="userFilter.email" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
