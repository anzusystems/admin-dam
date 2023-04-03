<script lang="ts" setup>
import { AFilterBooleanSelect, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'
import { useKeywordListFilter } from '@/model/coreDam/filter/KeywordFilter'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useKeywordListFilter()
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
        <VCol cols="2">
          <AFilterString
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="2">
          <AFilterString
            v-model="filter.text"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="2">
          <AFilterBooleanSelect
            v-model="filter.reviewed"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
