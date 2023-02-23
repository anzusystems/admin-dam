<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNull } from '@/utils/common'
import type { Pagination } from '@/types/Pagination'
import { useVModels } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    modelValue: Pagination
    itemsPerPageOptions?: number[]
    hideRecordsPerPage?: boolean
  }>(),
  {
    itemsPerPageOptions: () => [10, 25, 50],
    hideRecordsPerPage: false,
  }
)
const emit = defineEmits<{
  (e: 'change'): void
  (e: 'update:modelValue', data: Pagination): void
}>()

const { modelValue } = useVModels(props, emit)

const { t } = useI18n()

const lastPage = computed(() => {
  return Math.ceil(modelValue.value.totalCount / modelValue.value.rowsPerPage)
})

const displayedFrom = computed(() => {
  return modelValue.value.page * modelValue.value.rowsPerPage - modelValue.value.rowsPerPage + 1
})

const displayedTo = computed(() => {
  return (
    modelValue.value.page * modelValue.value.rowsPerPage -
    modelValue.value.rowsPerPage +
    modelValue.value.currentViewCount
  )
})

const disabledFirstAndPrev = computed(() => {
  return modelValue.value.page === 1
})

const disabledLast = computed(() => {
  return !isNull(modelValue.value.hasNextPage) || modelValue.value.page === lastPage.value
})

const disabledNext = computed(() => {
  return (
    (isNull(modelValue.value.hasNextPage) && modelValue.value.page === lastPage.value) ||
    modelValue.value.hasNextPage === false
  )
})

const computedTotalCountText = computed(() => {
  if (!isNull(modelValue.value.hasNextPage)) {
    return modelValue.value.hasNextPage ? displayedTo.value + 1 + '+' : displayedTo.value
  }
  return modelValue.value.totalCount
})

const rowsPerPageComputed = computed(() => {
  return modelValue.value.rowsPerPage
})
watch(rowsPerPageComputed, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    modelValue.value.page = 1
    emit('change')
  }
})
const pageComputed = computed(() => {
  return modelValue.value.page
})
watch(pageComputed, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('change')
  }
})

const onClickFirst = () => {
  modelValue.value.page = 1
}

const onClickLast = () => {
  modelValue.value.page = lastPage.value
}

const onClickPrev = () => {
  modelValue.value.page = modelValue.value.page - 1
}

const onClickNext = () => {
  modelValue.value.page = modelValue.value.page + 1
}
</script>

<template>
  <div class="anzu-data-footer">
    <div v-if="!hideRecordsPerPage" class="anzu-data-footer__page-limit">
      {{ t('common.datatable.itemsPerPage') }}:
      <VBtnToggle v-model="modelValue.rowsPerPage" class="ml-2" density="compact" mandatory data-cy="table-size">
        <VBtn
          v-for="item in itemsPerPageOptions"
          :key="item"
          :color="item === modelValue.rowsPerPage ? 'secondary' : ''"
          :value="item"
          density="compact"
          size="small"
          variant="text"
        >
          {{ item }}
        </VBtn>
      </VBtnToggle>
    </div>
    <div class="anzu-data-footer__pagination">
      {{ displayedFrom }} - {{ displayedTo }} {{ t('common.datatable.from') }} {{ computedTotalCountText }}
    </div>
    <div class="anzu-data-footer__icons-before">
      <VBtn
        :disabled="disabledFirstAndPrev"
        icon="mdi-page-first"
        size="small"
        variant="text"
        @click.stop="onClickFirst"
      />
      <VBtn
        :disabled="disabledFirstAndPrev"
        icon="mdi-chevron-left"
        size="small"
        variant="text"
        @click.stop="onClickPrev"
      />
    </div>
    <div class="current-page">
      <span>{{ modelValue.page }}</span>
    </div>
    <div class="anzu-data-footer__icons-after">
      <VBtn :disabled="disabledNext" icon="mdi-chevron-right" size="small" variant="text" @click.stop="onClickNext" />
      <VBtn :disabled="disabledLast" icon="mdi-page-last" size="small" variant="text" @click.stop="onClickLast" />
    </div>
  </div>
</template>

<style lang="scss">
.anzu-data-footer {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  font-size: 0.75rem;
  padding: 0 8px;

  > div.current-page {
    padding-left: 10px;
    padding-right: 10px;
    user-select: none;
    min-width: 40px;
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;
  }

  &__page-limit {
    display: flex;
    align-items: center;
    flex: 0 0 0;
    justify-content: flex-end;
    white-space: nowrap;
    margin-right: 14px;
  }

  &__pagination {
    display: block;
    text-align: center;
    margin: 0 32px 0 24px;
  }
}
</style>
