<script lang="ts" setup>
import type { ValidationScope } from '@anzusystems/common-admin'
import { DocId, isArray, isEmptyObject, objectGetValues, useValidateRequiredIf } from '@anzusystems/common-admin'
import { useAuthorSelectActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorFilter } from '@/model/coreDam/filter/AuthorFilter'
import { computed, onMounted, ref } from 'vue'
import type { Suggestions } from '@/types/coreDam/Asset'
import AuthorCreateButton from '@/views/coreDam/author/components/AuthorCreateButton.vue'
import type { Author } from '@/types/coreDam/Author'
import { useVuelidate } from '@vuelidate/core'
import CachedAuthorChip from '@/views/coreDam/author/components/CachedAuthorChip.vue'
import {
  useCachedAuthors,
  useCachedAuthorsForRemoteAutocomplete,
} from '@/views/coreDam/author/composables/cachedAuthors'
import AFormRemoteAutocompleteWithCached from '@/components/AFormRemoteAutocompleteWithCached.vue'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()

const requiredComputed = computed(() => !!props.required)

const requiredIf = useValidateRequiredIf()

const rules = {
  modelValueComputed: {
    required: requiredIf(requiredComputed.value),
  },
}

const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const { fetchItems, fetchItemsByIds } = useAuthorSelectActions()

const innerFilter = useAuthorFilter()

const suggestionsDefined = computed(() => !isEmptyObject(props.suggestions))
const suggestionsIdsComputed = computed(() => objectGetValues(props.suggestions))
const duplicateAuthorsIds = ref<DocId[]>([])
const duplicateAuthorsIdsExists = computed(() => duplicateAuthorsIds.value.length)

const existingAuthorsIds = computed(() => {
  const existingAuthorList: DocId[] = []
  suggestionsIdsComputed.value.forEach((ids) => {
    ids.forEach((id) => existingAuthorList.push(id))
  })
  return existingAuthorList
})

const addAuthor = async (id: null | DocId | undefined) => {
  if (!id) return
  if (!modelValueComputed.value.includes(id)) {
    modelValueComputed.value = [...modelValueComputed.value, ...[id]]
    duplicateAuthorsIds.value = duplicateAuthorsIds.value.filter((duplicateId) => duplicateId !== id)
  }
}

const addNewAuthorText = ref('')

const searchChange = (newValue: string) => {
  if (newValue.length > 0) addNewAuthorText.value = newValue
}

const { addManualToCachedAuthors } = useCachedAuthors()

const afterCreate = (author: Author) => {
  addManualToCachedAuthors(author)
  if (isArray(modelValueComputed.value)) {
    modelValueComputed.value = [...modelValueComputed.value, author.id]
    return
  }
  modelValueComputed.value = author.id
}

const itemSlotIsSelected = (item: DocId) => {
  if (isArray(modelValueComputed.value)) {
    return modelValueComputed.value.includes(item)
  } else if (modelValueComputed.value) {
    return modelValueComputed.value === item
  }
  return false
}

onMounted(() => {
  const duplicateAuthorIdsList: DocId[] = []
  suggestionsIdsComputed.value.forEach((ids) => {
    if (ids.length > 1) ids.forEach((id) => duplicateAuthorIdsList.push(id))
  })
  duplicateAuthorsIds.value = duplicateAuthorIdsList
})
</script>

<template>
  <div class="d-flex">
    <AFormRemoteAutocompleteWithCached
      v-model="modelValueComputed"
      :use-cached="useCachedAuthorsForRemoteAutocomplete"
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
            <CachedAuthorChip
              v-else
              :id="item.value"
              :key="item.value"
              disable-click
              text-only
              fallback-id-text
              hide-loader
              :append-icon="suggestionsDefined && !existingAuthorsIds.includes(item.value) ? 'mdi-new-box' : undefined"
            />
          </template>
        </VListItem>
      </template>
      <template #chip="{ item }">
        <CachedAuthorChip
          :id="item.value"
          :key="item.value"
          disable-click
          force-rounded
          :append-icon="suggestionsDefined && !existingAuthorsIds.includes(item.value) ? 'mdi-new-box' : undefined"
        />
      </template>
    </AFormRemoteAutocompleteWithCached>
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
      <span class="text-caption">{{ t('coreDam.author.conflicts') }}</span>
    </div>
    <div>
      <CachedAuthorChip
        v-for="authorId in duplicateAuthorsIds"
        :id="authorId"
        :key="authorId"
        class="mr-1 mt-1"
        close-icon="mdi-plus-circle"
        disable-click
        @close-chip="addAuthor"
      />
    </div>
  </div>
</template>
