<script lang="ts" setup>
import { usePermissionGroupListFilter } from '@/model/common/filter/PermissionGroupFilter'
import { AFilterInteger, AFilterString, AFilterWrapper } from '@anzusystems/common-admin'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = usePermissionGroupListFilter()
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
            v-model="filter.title"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
