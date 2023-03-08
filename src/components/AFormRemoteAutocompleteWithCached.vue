<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'
import { computed, inject, ref, toRefs, watch } from 'vue'
import type { DocId, FilterBag, IntegerId, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import {
  cloneDeep,
  isArray,
  isNull,
  isUndefined,
  stringSplitOnFirstOccurrence,
  SubjectScopeSymbol,
  SystemScopeSymbol,
  usePagination,
} from '@anzusystems/common-admin'
import type { ErrorObject } from '@vuelidate/core'
import { useI18n } from 'vue-i18n'

type FetchItemsByIdsType =
  | ((ids: IntegerId[]) => Promise<ValueObjectOption<IntegerId>[]>)
  | ((ids: DocId[]) => Promise<ValueObjectOption<DocId>[]>)

type FetchItemsType = (pagination: Pagination, filterBag: FilterBag) => Promise<ValueObjectOption<DocId | IntegerId>[]>

type UseCachedType = () => {
  fetch: any
  add: any
  addManualMinimal: any
  minimalValueFieldName: string
}

const props = withDefaults(
  defineProps<{
    modelValue: DocId | IntegerId | DocId[] | IntegerId[] | null | undefined
    label?: string
    required?: boolean
    multiple?: boolean
    clearable?: boolean
    v?: any
    errorMessage?: string
    hideDetails?: boolean
    hideLabel?: boolean
    fetchItems: FetchItemsType
    fetchItemsByIds: FetchItemsByIdsType
    innerFilter: FilterBag
    filterByField?: string
    disableInitFetch?: boolean
    chips?: boolean
    loading?: boolean
    useCached: UseCachedType
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    clearable: false,
    v: null,
    errorMessage: undefined,
    hideDetails: false,
    hideLabel: false,
    filterByField: 'name',
    disableInitFetch: false,
    chips: false,
    loading: false,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: DocId | IntegerId | DocId[] | IntegerId[] | null | undefined): void
  (e: 'blur', data: DocId | IntegerId | DocId[] | IntegerId[] | null | undefined): void
  (e: 'focus', data: DocId | IntegerId | DocId[] | IntegerId[] | null | undefined): void
  (e: 'searchChange', data: string): void
  (e: 'searchChangeDebounced', data: string): void
}>()

const { fetch, add, addManualMinimal, minimalValueFieldName } = props.useCached()

const modelValue = computed({
  get() {
    return props.modelValue
  },
  set(newValue: DocId | IntegerId | DocId[] | IntegerId[] | null | undefined) {
    emit('update:modelValue', cloneDeep<DocId | IntegerId | DocId[] | IntegerId[] | null | undefined>(newValue))
  },
})

const { t } = useI18n()
const system = inject<string | undefined>(SystemScopeSymbol, undefined)
const subject = inject<string | undefined>(SubjectScopeSymbol, undefined)

const isFocused = ref(false)
const search = ref('')
const loading = ref(false)
const { innerFilter } = toRefs(props)
const pagination = usePagination()
const fetchedItems = ref<Map<IntegerId | DocId, string>>(new Map())

const onFocus = () => {
  isFocused.value = true
  emit('focus', modelValue.value)
}

const onBlur = () => {
  isFocused.value = false
  props.v?.$touch()
  emit('blur', modelValue.value)
}

const errorMessageComputed = computed(() => {
  if (!isUndefined(props.errorMessage)) return [props.errorMessage]
  if (props.v?.$errors?.length) return props.v.$errors.map((item: ErrorObject) => item.$message)
  return []
})

const labelComputed = computed(() => {
  if (!isUndefined(props.label)) return props.label
  if (isUndefined(system) || isUndefined(subject) || isUndefined(props.v?.$path)) return ''
  const { end: path } = stringSplitOnFirstOccurrence(props.v?.$path, '.')
  return t(system + '.' + subject + '.model.' + path)
})

const requiredComputed = computed(() => {
  if (!isUndefined(props.required)) return props.required
  return props.v?.required && props.v?.required.$params.type === 'required'
})

const multipleComputedVuetifyTypeFix = computed(() => {
  if (props.multiple === false) return false
  return true as unknown as undefined
})

const onSearchUpdate = (query: string) => {
  if (!props.multiple && !isFocused.value && query.length === 0) return // vuetify fix
  search.value = query
}

const apiSearch = async (query: string) => {
  loading.value = true
  const filterField = innerFilter.value[props.filterByField]
  filterField.model = query
  fetchedItems.value.clear()
  const res = await props.fetchItems(pagination, innerFilter.value)
  res.forEach((item) => {
    fetchedItems.value.set(item.value, item.title)
  })
  loading.value = false
}

const allItems = computed<ValueObjectOption<DocId | IntegerId>[]>(() => {
  const final = new Map()
  if (isArray(modelValue.value)) {
    modelValue.value.forEach((value) => {
      final.set(value, '')
    })
  } else if (modelValue.value) {
    final.set(modelValue.value, modelValue.value + '')
  }
  fetchedItems.value.forEach((value, key) => {
    final.set(key, value + '')
  })
  return Array.from(final, ([key, value]) => {
    return { value: key, title: value }
  })
})

const tryToAddFromFetchedItems = (ids: Set<DocId | IntegerId>) => {
  return new Promise<boolean>((resolve) => {
    fetchedItems.value.forEach((value, key) => {
      if (ids.has(key)) {
        const object = {} as any
        object['id'] = key as DocId & IntegerId
        object[minimalValueFieldName] = value
        addManualMinimal(object)
      }
    })
    return resolve(true)
  })
}

watchDebounced(
  search,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      apiSearch(newValue)
      emit('searchChangeDebounced', newValue)
    }
  },
  { debounce: 300, maxWait: 1000 }
)

watch(search, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('searchChange', newValue)
  }
})

watch(
  modelValue,
  async (newValue) => {
    if (isNull(newValue) || isUndefined(newValue) || (isArray(newValue) && newValue.length === 0)) {
      return
    }
    const values = isArray(newValue) ? newValue : [newValue]
    const idsToFetch = new Set(values)
    await tryToAddFromFetchedItems(idsToFetch)

    if (idsToFetch.size > 0) {
      add(Array.from(idsToFetch) as Array<DocId & IntegerId>)
      fetch()
    }
  },
  { immediate: true }
)
</script>

<template>
  <VAutocomplete
    v-model="modelValue"
    :chips="chips"
    :items="allItems"
    item-title="title"
    item-value="value"
    no-filter
    :multiple="multipleComputedVuetifyTypeFix"
    :clearable="clearable"
    :error-messages="errorMessageComputed"
    :loading="loading"
    dirty
    @blur="onBlur"
    @focus="onFocus"
    @update:search="onSearchUpdate"
  >
    <template #label>
      <span v-if="!hideLabel" :key="requiredComputed + ''">
        {{ labelComputed }}<span v-if="requiredComputed" class="required" />
      </span>
    </template>
    <template v-if="chips" #chip="{ props: chipProps, item }">
      <slot name="chip" :props="chipProps" :item="item">
        <VChip v-bind="chipProps" :text="item.title" />
      </slot>
    </template>
    <template #item="{ props: itemProps, item }">
      <slot name="item" :props="itemProps" :item="item">
        <VListItem :props="itemProps" />
      </slot>
    </template>
  </VAutocomplete>
</template>
