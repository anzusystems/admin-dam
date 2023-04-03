<script lang="ts" setup>
import { useAnzuUserFilter } from '@/model/common/filter/AnzuUserFilter'
import { AFilterBooleanSelect, AFilterInteger, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useAnzuUserFilter()
const touched = ref(false)

const submitFilter = () => {
  touched.value = false
  emit('submitFilter')
}

const resetFilter = () => {
  touched.value = false
  emit('resetFilter')
}

const onAnyFilterUpdate = () => {
  touched.value = true
}
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <AFilterWrapper
      :touched="touched"
      @reset-filter="resetFilter"
    >
      <VRow align="start">
        <VCol
          cols="12"
          sm="2"
        >
          <AFilterInteger
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="5"
        >
          <AFilterString
            v-model="filter.email"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="5"
        >
          <AFilterBooleanSelect
            v-model="filter.enabled"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
