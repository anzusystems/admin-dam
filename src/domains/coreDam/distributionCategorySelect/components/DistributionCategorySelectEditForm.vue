<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { ASortableListEditor, type ListEditorHandle } from '@anzusystems/common-admin/labs'
import { useDistributionCategorySelectEditActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategoryOptionFactory } from '@/domains/coreDam/distributionCategory/factory/DistributionCategoryOptionFactory'
import DistributionCategoryOptionEditForm from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategoryOptionEditForm.vue'
import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'

type OptionRowSlotProps = {
  raw: DistributionCategoryOption
  actions: { update: (value: DistributionCategoryOption) => void }
}

const { distributionCategorySelect } = useDistributionCategorySelectEditActions()
const { createDefault } = useDistributionCategoryOptionFactory()

const optionFactory = (): DistributionCategoryOption => createDefault(distributionCategorySelect.value.id)

// Per-row save guard (mirrors useDistributionCategoryOptionValidation); runs on every row even when
// collapsed, so validateAll() can reveal invalid rows the unmounted inline form no longer reports.
const validateOption = (option: DistributionCategoryOption): boolean =>
  !!option.name && option.name.length >= 2 && !!option.value && option.value.length >= 1

const optionsEditor = ref<ListEditorHandle<DistributionCategoryOption> | null>(null)
defineExpose({
  validateAll: () => optionsEditor.value?.validateAll() ?? true,
  commit: (saved?: DistributionCategoryOption[]) => optionsEditor.value?.commit(saved),
})
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <ASortableListEditor
      ref="optionsEditor"
      v-model="distributionCategorySelect.options"
      compact-field="name"
      :factory="optionFactory"
      :validate="validateOption"
    >
      <template #item="{ raw, actions }: OptionRowSlotProps">
        <DistributionCategoryOptionEditForm
          :model-value="raw"
          @update:model-value="actions.update"
        />
      </template>
    </ASortableListEditor>
  </ASystemEntityScope>
</template>
