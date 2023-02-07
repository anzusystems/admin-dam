<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { useAssetLicenceListFilter } from '@/model/dam/filter/AssetLicenceFilter'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filterAssetLicence = useAssetLicenceListFilter()

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
        <VCol cols="1">
          <AFilterInteger v-model="filterAssetLicence.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filterAssetLicence.extId" />
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
