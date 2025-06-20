<script lang="ts" setup generic="I extends DamAuthorMinimal">
import {
  cloneDeep,
  type DamAuthor,
  type DamAuthorMinimal,
  type IntegerId,
  type ValidationScope,
} from '@anzusystems/common-admin'
import { AFormRemoteAutocompleteWithCached, type DocId, isArray, useValidate } from '@anzusystems/common-admin'
import { useAuthorSelectActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorFilter } from '@/model/coreDam/filter/AuthorFilter'
import { computed, ref } from 'vue'
import AuthorCreateButton from '@/views/coreDam/author/components/AuthorCreateButton.vue'
import { useVuelidate } from '@vuelidate/core'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import { useI18n } from 'vue-i18n'
import AuthorRemoteAutocompleteCachedAuthorChipConflicts from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChipConflicts.vue'
import {
  useCachedAuthors,
  useCachedAuthorsForRemoteAutocomplete,
} from '@/views/coreDam/author/composables/cachedAuthors'

const props = withDefaults(
  defineProps<{
    modelValue: DocId[]
    queueId?: string | undefined
    label?: string | undefined
    required?: boolean | null
    disabled?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    authorConflicts?: DocId[]
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
    authorConflicts: undefined,
    dataCy: undefined,
    validationScope: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: DocId[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', cloneDeep(newValue))
  },
})

const search = ref<string>('')
const loadingLocal = ref(false)
const fetchedItemsMinimal = ref<Map<IntegerId | DocId, I>>(new Map())

const { t } = useI18n()

const requiredComputed = computed(() => !!props.required)

const { requiredIf } = useValidate()

const rules = {
  modelValueComputed: {
    // eslint-disable-next-line vue/no-ref-object-reactivity-loss
    required: requiredIf(requiredComputed.value),
  },
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const { fetchItemsMinimal } = useAuthorSelectActions()

const innerFilter = useAuthorFilter()

const addAuthor = async (id: null | DocId | undefined) => {
  if (!id) return
  if (!modelValueComputed.value.includes(id)) {
    modelValueComputed.value = [...modelValueComputed.value, ...[id]]
  }
}

const addNewAuthorText = ref('')

const searchChange = (newValue: string) => {
  if (newValue.length > 0) addNewAuthorText.value = removeLastComma(newValue)
}

const { addManualToCachedAuthors } = useCachedAuthors()

const afterCreate = (author: DamAuthor) => {
  addManualToCachedAuthors(author)
  if (isArray(modelValueComputed.value)) {
    modelValueComputed.value = [...modelValueComputed.value, author.id]
    search.value = ''
  }
}

const itemSlotIsSelected = (item: DocId) => {
  if (isArray(modelValueComputed.value)) {
    return modelValueComputed.value.includes(item)
  } else if (modelValueComputed.value) {
    return modelValueComputed.value === item
  }
  return false
}

const authorCreateButton = ref<InstanceType<typeof AuthorCreateButton> | null>(null)

const removeLastComma = (value: string) => {
  if (value.endsWith(',')) return value.slice(0, -1)
  return value
}

const onEnterKeyup = () => {
  const value = removeLastComma(search.value)
  authorCreateButton.value?.open(value)
}

const onCommaKeyup = () => {
  const value = removeLastComma(search.value)
  authorCreateButton.value?.open(value)
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
      :use-cached="useCachedAuthorsForRemoteAutocomplete"
      :v="v$"
      :required="requiredComputed"
      :label="label"
      :fetch-items-minimal="fetchItemsMinimal"
      :inner-filter="innerFilter"
      :multiple="multiple"
      :clearable="clearable"
      filter-by-field="text"
      :filter-sort-by="null"
      :data-cy="dataCy"
      item-title="name"
      item-value="id"
      :min-search-chars="2"
      min-search-text="common.damImage.author.filterMinChars"
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
            <AuthorRemoteAutocompleteCachedAuthorChip
              :id="itemSlotItem.value"
              :key="itemSlotItem.value"
              :queue-id="queueId"
              :title="itemSlotItem.title"
              text-only
              :force-reviewed="itemSlotItem.raw?.raw?.reviewed"
            />
          </template>
        </VListItem>
      </template>
      <template #chip="{ item: chipSlotItem }">
        <AuthorRemoteAutocompleteCachedAuthorChip
          :id="chipSlotItem.value"
          :key="chipSlotItem.value"
          :queue-id="queueId"
          :title="chipSlotItem.title"
          force-rounded
        />
      </template>
      <template #append-item>
        <VListItem
          v-if="showAdd"
          class="a-authors-append-item"
        >
          <ABtnSecondary
            size="small"
            :text="addNewAuthorText"
            prepend-icon="mdi-plus-circle"
            @click.stop="onCommaKeyup"
          />
        </VListItem>
      </template>
    </AFormRemoteAutocompleteWithCached>
    <div>
      <AuthorCreateButton
        ref="authorCreateButton"
        variant="icon"
        data-cy="add-author"
        :initial-value="addNewAuthorText"
        disable-redirect
        :disabled="disabled"
        @on-success="afterCreate"
      />
    </div>
  </div>
  <div
    v-if="!disabled && authorConflicts && authorConflicts.length > 0"
    class="d-flex flex-column"
  >
    <div>
      <span class="text-caption">{{ t('common.damImage.author.conflicts') }}</span>
    </div>
    <div>
      <AuthorRemoteAutocompleteCachedAuthorChipConflicts
        v-for="authorId in authorConflicts"
        :id="authorId"
        :key="authorId"
        class="mr-1 mt-1"
        @add-author="addAuthor(authorId)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.a-authors-append-item {
  position: sticky;
  bottom: 0;
  background-color: white;
  transform: translateY(8px);
}
</style>
