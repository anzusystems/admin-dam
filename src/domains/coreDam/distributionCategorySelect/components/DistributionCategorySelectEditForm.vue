<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { useDistributionCategorySelectEditActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategoryOptionFactory } from '@/domains/coreDam/distributionCategory/factory/DistributionCategoryOptionFactory'
import DistributionCategoryOptionEditForm from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategoryOptionEditForm.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'

const { distributionCategorySelect } = useDistributionCategorySelectEditActions()
const { createDefault } = useDistributionCategoryOptionFactory()

const customSortableUpdate = (
  items: DistributionCategoryOption[],
  from: number | undefined,
  to: number | undefined
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
      color="indigo"
      data-cy="button-add-option"
      @click="addOption"
    >
      <VIcon icon="mdi-plus" />
    </VBtn>
  </ASystemEntityScope>
</template>
