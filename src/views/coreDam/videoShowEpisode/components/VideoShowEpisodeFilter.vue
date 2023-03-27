<script lang="ts" setup>
import { AFilterString, AFilterWrapper } from '@anzusystems/common-admin'
import { useVideoShowEpisodeListFilter } from '@/model/coreDam/filter/VideoShowEpisodeFilter'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useVideoShowEpisodeListFilter()
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
        <VCol cols="4">
          <AFilterString
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="4">
          <AFilterString
            v-model="filter.title"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
