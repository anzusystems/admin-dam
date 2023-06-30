<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import { ASystemEntityScope, isUndefined } from '@anzusystems/common-admin'
import {
  useDistributionCategorySelectEditActions
} from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategoryOptionFactory } from '@/model/coreDam/factory/DistributionCategoryOptionFactory'
import DistributionCategoryOptionEditForm
  from '@/views/coreDam/distributionCategorySelect/components/DistributionCategoryOptionEditForm.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { nextTick, ref } from 'vue'
import { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'

const { distributionCategorySelect } = useDistributionCategorySelectEditActions()
const { createDefault } = useDistributionCategoryOptionFactory()

const customSortableUpdate = (
  items: DistributionCategoryOption[],
  from: number | undefined,
  to: number | undefined,
) => {
  if (isUndefined(from) || isUndefined(to)) return
  if (to >= 0 && to < items.length) {
    const element = items.splice(from, 1)[0]
    nextTick(() => {
      items.splice(to, 0, element)
      reorder()
    })
  }
}

const sortableEl = ref<HTMLElement | null>(null)
useSortable(sortableEl, distributionCategorySelect.value.options, {
  handle: '.v-input__prepend',
  onUpdate: (e) => {
    customSortableUpdate(distributionCategorySelect.value.options, e.oldIndex, e.newIndex)
  },
})

const addOption = () => {
  const option = createDefault(distributionCategorySelect.value.id)
  distributionCategorySelect.value.options.push(option)
  reorder()
}

const reorder = () => {
  let position = 0
  distributionCategorySelect.value.options.forEach((option) => {
    option.position = ++position
  })
}

const removeItem = (index: number) => {
  distributionCategorySelect.value.options.splice(index, 1)
}
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <div ref="sortableEl">
      <DistributionCategoryOptionEditForm
        v-for="(item, index) in distributionCategorySelect.options"
        :key="item.id"
        v-model="distributionCategorySelect.options[index]"
        @remove="() => removeItem(index)"
      />
    </div>
    <VBtn
      class="mx-2"
      dark
      color="indigo"
      data-cy="button-add-option"
      @click="addOption"
    >
      <VIcon
        dark
        icon="mdi-plus"
      />
    </VBtn>
  </ASystemEntityScope>
</template>
