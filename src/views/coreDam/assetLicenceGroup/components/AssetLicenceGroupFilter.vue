<script lang="ts" setup>
import { useAssetLicenceGroupListFilter } from '@/model/coreDam/filter/AssetLicenceGroupFilter'
import { AFilterInteger, AFilterWrapper } from '@anzusystems/common-admin'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filterAssetLicenceGroup = useAssetLicenceGroupListFilter()
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
        <VCol cols="1">
          <AFilterInteger
            v-model="filterAssetLicenceGroup.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
