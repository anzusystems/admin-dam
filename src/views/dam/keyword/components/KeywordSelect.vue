<script lang="ts" setup>
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import { useKeywordSelectActions } from '@/views/dam/keyword/composables/keywordActions'
import { useKeywordFilter } from '@/model/dam/filter/KeywordFilter'
import { computed, ref } from 'vue'
import type { Suggestions } from '@/types/dam/Asset'
import { getValues, isEmpty } from '@/utils/object'
import { loadLazyKeyword, useLazyKeyword } from '@/views/dam/keyword/composables/lazyKeyword'
import KeywordCreateButton from '@/views/dam/keyword/components/KeywordCreateButton.vue'
import type { Keyword } from '@/types/dam/Keyword'
import { isArray } from '@/utils/common'
import { requiredIf } from '@/plugins/validators'
import { useVuelidate } from '@vuelidate/core'
import type { ValidationScope } from '@/types/Validation'

const props = withDefaults(
  defineProps<{
    modelValue: string | null | string[] | any
    label?: string | null
    required?: boolean | null
    disabled?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    suggestions?: Suggestions
    chips?: boolean
    dataCy?: string
    validationScope?: ValidationScope
  }>(),
  {
    label: null,
    required: null,
    disabled: undefined,
    multiple: false,
    clearable: false,
    suggestions: () => {
      return {}
    },
    chips: false,
    dataCy: '',
    validationScope: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | null | string[]): void
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

const rules = {
  modelValueComputed: {
    required: requiredIf(requiredComputed),
  },
}

const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const { loadedAll } = useLazyKeyword()
const { fetchItems, fetchItemsByIds } = useKeywordSelectActions()

const innerFilter = useKeywordFilter()

const suggestionsDefined = computed(() => !isEmpty(props.suggestions))
const existingKeywordsIds = computed(() => {
  const existingKeywordsList: string[] = []
  getValues(props.suggestions).forEach((ids) => ids.forEach((id) => existingKeywordsList.push(id)))
  return existingKeywordsList
})
const existingKeywordsNames = computed(() => {
  return Object.keys(props.suggestions)
})

const isNewKeyword = (name: string, id: string) => {
  return (
    loadedAll.value &&
    suggestionsDefined.value &&
    !existingKeywordsIds.value.includes(id) &&
    existingKeywordsNames.value.includes(name)
  )
}

const addNewKeywordText = ref('')

const searchChange = (newValue: string) => {
  if (newValue.length > 0) addNewKeywordText.value = newValue
}

const { manualAddLazyKeyword } = loadLazyKeyword()

const afterCreate = (keyword: Keyword) => {
  manualAddLazyKeyword(keyword)
  if (isArray(modelValueComputed.value)) {
    modelValueComputed.value = [...modelValueComputed.value, keyword.id]
    return
  }
  modelValueComputed.value = keyword.id
}
</script>

<template>
  <div class="d-flex">
    <ARemoteSelect
      v-model="modelValueComputed"
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
      :fetch-few-on-init="false"
      :lazy-loader="useLazyKeyword"
      @search-change="searchChange"
    >
      <template #chip="{ props: chipProps, item }">
        <VChip v-bind="chipProps">
          <VIcon v-if="isNewKeyword(item.raw.title, item.raw.value)" start icon="mdi-new-box" />
          <span v-if="loadedAll">{{ item.title }}</span>
          <VProgressCircular v-else indeterminate size="15" />
        </VChip>
      </template>
    </ARemoteSelect>
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
