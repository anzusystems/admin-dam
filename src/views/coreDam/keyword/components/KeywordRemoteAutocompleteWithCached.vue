<script lang="ts" setup>
import type { DamKeyword, IntegerId } from '@anzusystems/common-admin'
import {
  AFormRemoteAutocompleteWithCached,
  type DocId,
  isArray,
  useAlerts,
  useDamKeywordFactory,
  useValidate,
  type ValidationScope,
} from '@anzusystems/common-admin'
import { useKeywordSelectActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordFilter } from '@/model/coreDam/filter/KeywordFilter'
import { computed, ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import KeywordRemoteAutocompleteCachedKeywordChip from '@/views/coreDam/keyword/components/KeywordRemoteAutocompleteCachedKeywordChip.vue'
import {
  useCachedKeywords,
  useCachedKeywordsForRemoteAutocomplete,
} from '@/views/coreDam/keyword/composables/cachedKeywords'
import { createKeyword } from '@/services/api/coreDam/keywordApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const props = withDefaults(
  defineProps<{
    modelValue: DocId | null | DocId[] | any
    queueId?: string | undefined
    label?: string | undefined
    required?: boolean | null
    disabled?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    dataCy?: string
    validationScope?: ValidationScope
  }>(),
  {
    label: undefined,
    queueId: undefined,
    required: null,
    disabled: undefined,
    multiple: false,
    clearable: false,
    dataCy: undefined,
    validationScope: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: DocId | null | DocId[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', [...newValue])
  },
})

const search = ref<string>('')
const loadingLocal = ref(false)
const fetchedItemsMinimal = ref<Map<IntegerId | DocId, any>>(new Map())

const requiredComputed = computed(() => !!props.required)

const { requiredIf } = useValidate()

const rules = {
  modelValueComputed: {
    required: requiredIf(requiredComputed),
  },
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const { fetchItemsMinimal } = useKeywordSelectActions()

const innerFilter = useKeywordFilter()

const addNewKeywordText = ref('')

const searchChange = (newValue: string) => {
  if (newValue.length > 0) addNewKeywordText.value = removeLastComma(newValue)
}

const { addManualToCachedKeywords } = useCachedKeywords()

const afterCreate = (keyword: DamKeyword) => {
  addManualToCachedKeywords(keyword)
  if (isArray(modelValueComputed.value)) {
    modelValueComputed.value = [...modelValueComputed.value, keyword.id]
    search.value = ''
    return
  }
  modelValueComputed.value = keyword.id
  search.value = ''
}

const itemSlotIsSelected = (item: DocId) => {
  if (isArray(modelValueComputed.value)) {
    return modelValueComputed.value.includes(item)
  } else if (modelValueComputed.value) {
    return modelValueComputed.value === item
  }
  return false
}

const { showErrorsDefault } = useAlerts()
const { createDefault } = useDamKeywordFactory()
const { currentExtSystemId } = useCurrentExtSystem()

const createOrSelectKeyword = async (name: string) => {
  const keywordCreate = createDefault(currentExtSystemId.value, true)
  keywordCreate.name = removeLastComma(name)
  if (keywordCreate.name.length < 3) return
  try {
    const keywordRes = await createKeyword(keywordCreate)
    afterCreate(keywordRes)
  } catch (error) {
    showErrorsDefault(error)
  }
}

const removeLastComma = (value: string) => {
  if (value.endsWith(',')) return value.slice(0, -1)
  return value
}

const onEnterKeyup = () => {
  const value = removeLastComma(search.value)
  createOrSelectKeyword(value)
}

const onCommaKeyup = () => {
  const value = removeLastComma(search.value)
  createOrSelectKeyword(value)
}

const showAdd = computed(() => {
  if (loadingLocal.value) return false
  if (search.value.length < 2 || search.value.length > 255) return false
  if (fetchedItemsMinimal.value.size === 0) return true
  return ![...fetchedItemsMinimal.value.values()].some(
    (item) => item.name?.toLowerCase() === search.value!.toLowerCase()
  )
})
</script>

<template>
  <div class="d-flex">
    <AFormRemoteAutocompleteWithCached
      v-model="modelValueComputed"
      v-model:search="search"
      v-model:loading-local="loadingLocal"
      v-model:fetched-items-minimal="fetchedItemsMinimal"
      :use-cached="useCachedKeywordsForRemoteAutocomplete"
      :v="v$"
      :required="requiredComputed"
      :label="label"
      :fetch-items-minimal="fetchItemsMinimal"
      :inner-filter="innerFilter"
      :multiple="multiple"
      :clearable="clearable"
      filter-by-field="text"
      :filter-sort-by="null"
      item-title="name"
      item-value="id"
      :data-cy="dataCy"
      :min-search-chars="3"
      min-search-text="common.damImage.keyword.filterMinChars"
      @search-change="searchChange"
      @keyup.enter="onEnterKeyup"
      @keyup.,="onCommaKeyup"
    >
      <template #item="{ props: itemSlotProps, item: itemSlotItem }">
        <VListItem
          v-bind="itemSlotProps"
          @click.prevent=""
        >
          <template
            v-if="multiple"
            #prepend
          >
            <VCheckboxBtn
              :model-value="itemSlotIsSelected(itemSlotItem.value)"
              :ripple="false"
            />
          </template>
          <template #title>
            <KeywordRemoteAutocompleteCachedKeywordChip
              :id="itemSlotItem.value"
              :key="itemSlotItem.value"
              :queue-id="queueId"
              :title="itemSlotItem.title"
              text-only
            />
          </template>
        </VListItem>
      </template>
      <template #chip="{ item: chipSlotItem }">
        <KeywordRemoteAutocompleteCachedKeywordChip
          :id="chipSlotItem.value"
          :key="chipSlotItem.value"
          :queue-id="queueId"
          :title="chipSlotItem.title"
          force-rounded
        />
      </template>
      <template #append-item>
        <VListItem v-if="showAdd">
          <ABtnSecondary
            size="small"
            :text="addNewKeywordText"
            prepend-icon="mdi-plus-circle"
            @click.stop="onCommaKeyup"
          />
        </VListItem>
      </template>
    </AFormRemoteAutocompleteWithCached>
  </div>
</template>
