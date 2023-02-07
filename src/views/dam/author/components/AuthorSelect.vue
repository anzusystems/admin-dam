<script lang="ts" setup>
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import { useAuthorSelectActions } from '@/views/dam/author/composables/authorActions'
import { useAuthorFilter } from '@/model/dam/filter/AuthorFilter'
import LazyAuthorChip from '@/views/dam/author/components/LazyAuthorChip.vue'
import { loadLazyAuthor, useLazyAuthor } from '@/views/dam/author/composables/lazyAuthor'
import { computed, onMounted, ref } from 'vue'
import type { Suggestions } from '@/types/dam/Asset'
import { getValues, isEmpty } from '@/utils/object'
import AuthorCreateButton from '@/views/dam/author/components/AuthorCreateButton.vue'
import { isArray } from '@/utils/common'
import type { Author } from '@/types/dam/Author'
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
    required: requiredIf(requiredComputed.value),
  },
}

const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const { loadedAll } = useLazyAuthor()
const { fetchItems, fetchItemsByIds } = useAuthorSelectActions()

const innerFilter = useAuthorFilter()

const suggestionsDefined = computed(() => !isEmpty(props.suggestions))
const suggestionsIdsComputed = computed(() => getValues(props.suggestions))
const duplicateAuthorsIds = ref<string[]>([])
const duplicateAuthorsIdsExists = computed(() => duplicateAuthorsIds.value.length)

const existingAuthorsIds = computed(() => {
  const existingAuthorList: string[] = []
  suggestionsIdsComputed.value.forEach((ids) => {
    ids.forEach((id) => existingAuthorList.push(id))
  })
  return existingAuthorList
})

const addAuthor = async (id: string) => {
  if (!modelValueComputed.value.includes(id)) {
    modelValueComputed.value = [...modelValueComputed.value, ...[id]]
    duplicateAuthorsIds.value = duplicateAuthorsIds.value.filter((duplicateId) => duplicateId !== id)
  }
}

const addNewAuthorText = ref('')

const searchChange = (newValue: string) => {
  if (newValue.length > 0) addNewAuthorText.value = newValue
}

const { manualAddLazyAuthor } = loadLazyAuthor()

const afterCreate = (author: Author) => {
  manualAddLazyAuthor(author)
  if (isArray(modelValueComputed.value)) {
    modelValueComputed.value = [...modelValueComputed.value, author.id]
    return
  }
  modelValueComputed.value = author.id
}

onMounted(() => {
  const duplicateAuthorIdsList: string[] = []
  suggestionsIdsComputed.value.forEach((ids) => {
    if (ids.length > 1) ids.forEach((id) => duplicateAuthorIdsList.push(id))
  })
  duplicateAuthorsIds.value = duplicateAuthorIdsList
})
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
      :fetch-few-on-init="false"
      :lazy-loader="useLazyAuthor"
      :data-cy="dataCy"
      @search-change="searchChange"
    >
      <template #chip="{ props: chipProps, item }">
        <VChip v-bind="chipProps">
          <VIcon
            v-if="loadedAll && suggestionsDefined && !existingAuthorsIds.includes(item.value)"
            start
            icon="mdi-new-box"
          />
          <span v-if="loadedAll">{{ item.title }}</span>
          <VProgressCircular v-else indeterminate size="15" />
        </VChip>
      </template>
    </ARemoteSelect>
    <div>
      <AuthorCreateButton
        variant="icon"
        :initial-value="addNewAuthorText"
        disable-redirect
        :disabled="disabled"
        @after-create="afterCreate"
      />
    </div>
  </div>
  <div v-if="suggestionsDefined && duplicateAuthorsIdsExists" class="d-flex flex-column">
    <div>
      <span class="text-caption">Authors conflicts</span>
    </div>
    <div>
      <LazyAuthorChip
        v-for="authorId in duplicateAuthorsIds"
        :id="authorId"
        :key="authorId"
        title=""
        class="mr-1 mt-1"
        close-icon="mdi-plus-circle"
        :allow-click="false"
        @close-chip="addAuthor"
      >
      </LazyAuthorChip>
    </div>
  </div>
</template>
