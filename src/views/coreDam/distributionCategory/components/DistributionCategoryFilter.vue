<script lang="ts" setup>
import { useDistributionCategoryListFilter } from '@/model/coreDam/filter/DistributionCategoryFilter'
import { useAssetType } from '@/model/coreDam/valueObject/AssetType'
import {
  AFilterInteger,
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
} from '@anzusystems/common-admin'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useDistributionCategoryListFilter()
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

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <AFilterWrapper
      :touched="touched"
      enable-top
      @reset-filter="resetFilter"
    >
      <template #top>
        <VRow align="start">
          <VCol
            cols="12"
            md="6"
          >
            <AFilterValueObjectOptionsSelect
              v-model="filter.type"
              :items="assetTypeOptions"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
      </template>
      <VRow align="start">
        <VCol cols="1">
          <AFilterInteger
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="2">
          <AFilterString
            v-model="filter.name"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
