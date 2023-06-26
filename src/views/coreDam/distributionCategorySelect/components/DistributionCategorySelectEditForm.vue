<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import Draggable from 'vuedraggable'
import { useDistributionCategorySelectEditActions } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategoryOptionFactory } from '@/model/coreDam/factory/DistributionCategoryOptionFactory'
import DistributionCategoryOptionEditForm from '@/views/coreDam/distributionCategorySelect/components/DistributionCategoryOptionEditForm.vue'

const { distributionCategorySelect } = useDistributionCategorySelectEditActions()
const { createDefault } = useDistributionCategoryOptionFactory()

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
    <Draggable
      v-model="distributionCategorySelect.options"
      item-key="position"
      @change="reorder"
    >
      <template #item="{ index }">
        <DistributionCategoryOptionEditForm
          :key="index"
          v-model="distributionCategorySelect.options[index]"
          class="draggable__item"
          @remove="() => removeItem(index)"
        />
      </template>
      <template #footer>
        <v-btn
          class="mx-2"
          dark
          color="indigo"
          data-cy="button-add-option"
          @click="addOption"
        >
          <v-icon dark> mdi-plus </v-icon>
        </v-btn>
      </template>
    </Draggable>
  </ASystemEntityScope>
</template>
