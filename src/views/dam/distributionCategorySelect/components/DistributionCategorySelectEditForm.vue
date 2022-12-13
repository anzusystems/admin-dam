<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategorySelectApi'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import Draggable from 'vuedraggable'
import { useDistributionCategorySelectEditActions } from '@/views/dam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategoryOptionFactory } from '@/model/dam/factory/DistributionCategoryOptionFactory'
import DistributionCategoryOptionEditForm from '@/views/dam/distributionCategorySelect/components/DistributionCategoryOptionEditForm.vue'

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
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <Draggable v-model="distributionCategorySelect.options" item-key="position" @change="reorder">
      <template #item="{ index }">
        <DistributionCategoryOptionEditForm
          class="draggable__item"
          v-model="distributionCategorySelect.options[index]"
          :key="index"
          @remove="() => removeItem(index)"
        >
        </DistributionCategoryOptionEditForm>
      </template>
      <template #footer>
        <v-btn class="mx-2" fab dark color="indigo" @click="addOption">
          <v-icon dark> mdi-plus </v-icon>
        </v-btn>
      </template>
    </Draggable>
  </ASystemEntityScope>
</template>
