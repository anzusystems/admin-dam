<script lang="ts" setup>
import type { ValidationScope } from '@anzusystems/common-admin'
import { DocId, isArray, isEmptyObject, objectGetValues, useValidateRequiredIf } from '@anzusystems/common-admin'
import { useKeywordSelectActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordFilter } from '@/model/coreDam/filter/KeywordFilter'
import { computed, ref } from 'vue'
import type { Suggestions } from '@/types/coreDam/Asset'
import KeywordCreateButton from '@/views/coreDam/keyword/components/KeywordCreateButton.vue'
import type { Keyword } from '@/types/coreDam/Keyword'
import { useVuelidate } from '@vuelidate/core'
import AFormRemoteAutocompleteWithCached from '@/components/AFormRemoteAutocompleteWithCached.vue'
import CachedKeywordChip from '@/views/coreDam/keyword/components/CachedKeywordChip.vue'
import {
  useCachedKeywords,
  useCachedKeywordsForRemoteAutocomplete,
} from '@/views/coreDam/keyword/composables/cachedKeywords'

const props = withDefaults(
  defineProps<{
    modelValue: DocId | null | DocId[] | any
    label?: string | undefined
    required?: boolean | null
    disabled?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    suggestions?: Suggestions
    chips?: boolean
    disableInitFetch?: boolean
    dataCy?: string
    validationScope?: ValidationScope
  }>(),
  {
    label: undefined,
    required: null,
    disabled: undefined,
    multiple: false,
    clearable: false,
    suggestions: () => {
      return {}
    },
    chips: false,
    disableInitFetch: false,
    dataCy: '',
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

const requiredComputed = computed(() => !!props.required)

const requiredIf = useValidateRequiredIf()

const rules = {
  modelValueComputed: {
    required: requiredIf(requiredComputed),
  },
}

const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const { fetchItems, fetchItemsByIds } = useKeywordSelectActions()

const innerFilter = useKeywordFilter()

const suggestionsDefined = computed(() => !isEmptyObject(props.suggestions))
const existingKeywordsIds = computed(() => {
  const existingKeywordsList: DocId[] = []
  objectGetValues(props.suggestions).forEach((ids) => ids.forEach((id) => existingKeywordsList.push(id)))
  return existingKeywordsList
})
const existingKeywordsNames = computed(() => {
  return Object.keys(props.suggestions)
})

const isNewKeyword = (name: string, id: DocId) => {
  return (
    suggestionsDefined.value && !existingKeywordsIds.value.includes(id) && existingKeywordsNames.value.includes(name)
  )
}

const addNewKeywordText = ref('')

const searchChange = (newValue: string) => {
  if (newValue.length > 0) addNewKeywordText.value = newValue
}

const { addManualToCachedKeywords } = useCachedKeywords()

const afterCreate = (keyword: Keyword) => {
  addManualToCachedKeywords(keyword)
  if (isArray(modelValueComputed.value)) {
    modelValueComputed.value = [...modelValueComputed.value, keyword.id]
    return
  }
  modelValueComputed.value = keyword.id
}

const itemSlotIsSelected = (item: DocId) => {
  if (isArray(modelValueComputed.value)) {
    return modelValueComputed.value.includes(item)
  } else if (modelValueComputed.value) {
    return modelValueComputed.value === item
  }
  return false
}
</script>

<template>
  <div class="d-flex">
    <AFormRemoteAutocompleteWithCached
      v-model="modelValueComputed"
      :use-cached="useCachedKeywordsForRemoteAutocomplete"
      :v="v$"
      :required="requiredComputed"
      :label="label"
      :fetch-items="fetchItems"
      :fetch-items-by-ids="fetchItemsByIds"
      :inner-filter="innerFilter"
      :multiple="multiple"
      :clearable="clearable"
      :chips="chips"
      filter-by-field="text"
      :data-cy="dataCy"
      :disable-init-fetch="disableInitFetch"
      @search-change="searchChange"
    >
      <template #item="{ props: itemProps, item }">
        <VListItem v-bind="itemProps">
          <template #prepend>
            <VCheckboxBtn :model-value="itemSlotIsSelected(item.value)" :ripple="false" />
          </template>
          <template #title>
            <div v-if="item.title?.length > 0">{{ item.title }}</div>
            <CachedKeywordChip
              v-else
              :id="item.value"
              :key="item.value"
              disable-click
              text-only
              fallback-id-text
              hide-loader
              :append-icon="isNewKeyword(item.raw.title, item.raw.value) ? 'mdi-new-box' : undefined"
            />
          </template>
        </VListItem>
      </template>
      <template #chip="{ item }">
        <CachedKeywordChip
          :id="item.value"
          :key="item.value"
          disable-click
          force-rounded
          :append-icon="isNewKeyword(item.raw.title, item.raw.value) ? 'mdi-new-box' : undefined"
        />
      </template>
    </AFormRemoteAutocompleteWithCached>
    <div>
      <KeywordCreateButton
        variant="icon"
        :initial-value="addNewKeywordText"
        disable-redirect
        :disabled="disabled"
        @after-create="afterCreate"
      />
    </div>
  </div>
</template>
