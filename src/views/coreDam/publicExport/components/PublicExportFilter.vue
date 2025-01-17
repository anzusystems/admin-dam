<script lang="ts" setup>
import { usePublicExportListFilter } from '@/model/coreDam/filter/PublicExportFilter'
import { AFilterString, AFilterValueObjectOptionsSelect, AFilterWrapper } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useExportTypeTypes } from '@/model/coreDam/valueObject/ExportType'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = usePublicExportListFilter()
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

const { getExportTypeOption } = useExportTypeTypes()
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
        <VCol cols="3">
          <AFilterString
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="3">
          <AFilterString
            v-model="filter.slug"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="3">
          <AFilterValueObjectOptionsSelect
            v-model="filter.type"
            :items="getExportTypeOption"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
