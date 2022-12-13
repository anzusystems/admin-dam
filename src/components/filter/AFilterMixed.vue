<script lang="ts" setup>
import type { Filter } from '@/types/Filter'
import type { Ref } from 'vue'
import { computed, ref, toRefs, watch } from 'vue'
import { isDocId, isEmpty, isInt, isString, isUndefined } from '@/utils/common'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'

const props = withDefaults(
  defineProps<{
    filterId?: Filter | undefined
    filterDocId?: Filter | undefined
    filterText?: Filter | undefined
    filterUrl?: Filter | undefined
    filterOverrides?: Filter[] | undefined
  }>(),
  {}
)
const model = ref('')
const { filterId, filterText, filterDocId, filterUrl, filterOverrides } = toRefs(props)

const filterActive = (filter: Ref<Filter | undefined> | undefined): filter is Ref<Filter> => {
  return !isUndefined(filter) && !isUndefined(filter.value)
}
const { clearOne } = useFilterHelpers()
const clearIfActive = (filter: Ref<Filter | undefined> | undefined) => {
  if (filterActive(filter)) {
    clearOne(filter.value)
  }
}
const clearAllActiveExcept = (exceptFilter: Ref<Filter | undefined> | undefined = undefined) => {
  if (exceptFilter?.value?.title !== filterId?.value?.title) {
    clearIfActive(filterId)
  }
  if (exceptFilter?.value?.title !== filterDocId?.value?.title) {
    clearIfActive(filterDocId)
  }
  if (exceptFilter?.value?.title !== filterText?.value?.title) {
    clearIfActive(filterText)
  }
  if (exceptFilter?.value?.title !== filterUrl?.value?.title) {
    clearIfActive(filterUrl)
  }
  if (!isUndefined(filterOverrides)) {
    filterOverrides.value?.forEach((filter) => {
      if (exceptFilter?.value?.title !== filter.title) {
        clearOne(filter)
      }
    })
  }
}
const overrideFilter: Ref<Filter | undefined> = ref(undefined)
watch(overrideFilter, () => {
  if (filterActive(overrideFilter)) {
    overrideFilter.value.model = model.value
    currentFilter.value = overrideFilter.value
    clearAllActiveExcept(overrideFilter)
    return
  }
  setFilters(model.value)
})
const currentFilter: Ref<Filter | undefined> = ref(undefined)
watch(model, (newModel: string) => {
  setFilters(newModel)
})
const setFilters = (newModel: string) => {
  if (filterActive(overrideFilter)) {
    overrideFilter.value.model = newModel
    return
  }
  const filter = autodetectFilter(newModel)
  if (!isUndefined(filter)) {
    filter.model = newModel
  }
  currentFilter.value = filter
  clearAllActiveExcept(currentFilter)
}
const autodetectFilter = (newModel: string): Filter | undefined => {
  if (isInt(newModel)) {
    if (filterActive(filterId)) {
      return filterId.value
    }
  }
  if (isDocId(newModel)) {
    if (filterActive(filterDocId)) {
      return filterDocId.value
    }
  }
  if (isString(newModel) && newModel.length > 0) {
    if (filterActive(filterUrl) && newModel.startsWith('http')) {
      return filterUrl.value
    }
    if (filterActive(filterText)) {
      return filterText.value
    }
  }
  return undefined
}

const label = computed(() => {
  if (filterActive(overrideFilter)) {
    return overrideFilter.value.title
  }
  if (filterActive(currentFilter)) {
    return currentFilter.value.title
  }
  const filterLabels = []
  if (filterActive(filterId)) {
    filterLabels.push(filterId.value.title)
  }
  if (filterActive(filterDocId)) {
    filterLabels.push(filterDocId.value.title)
  }
  if (filterActive(filterUrl)) {
    filterLabels.push(filterUrl.value.title)
  }
  if (filterActive(filterText)) {
    filterLabels.push(filterText.value.title)
  }
  return filterLabels.join('/')
})

const currentFilterModel = computed(() => {
  return currentFilter.value?.model
})
watch(currentFilterModel, (newModel) => {
  if (!isEmpty(model.value) && isEmpty(newModel)) {
    model.value = ''
  }
})
</script>

<template>
  <VTextField v-model="model" :label="label">
    <template v-slot:append v-if="filterOverrides">
      <VBtnToggle v-model="overrideFilter" class="override-toggle" divided>
        <VBtn v-for="(override, index) in filterOverrides" :key="index" size="small" :value="override">
          {{ override.title }}
        </VBtn>
      </VBtnToggle>
    </template>
  </VTextField>
</template>

<style lang="scss" scoped>
.override-toggle {
  position: relative;
  top: -8px;
  left: -17px;
  height: 40px;
  border: 1px solid #a1a1a1;
}
</style>
