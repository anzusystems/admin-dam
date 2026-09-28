<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  AUnsavedConfirmDialog,
  defineBreadcrumbs,
  useUnsavedChangesGuard,
} from '@anzusystems/common-admin'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DistributionCategorySelectEditForm from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectEditForm.vue'
import { useDistributionCategorySelectEditActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const {
  saveButtonLoading,
  saveAndCloseButtonLoading,
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  distributionCategorySelect,
} = useDistributionCategorySelectEditActions()

// Asks before leaving with unsaved rows in the list editor, which registers itself by its label.
const guard = useUnsavedChangesGuard({ sources: [] })

const editForm = ref<InstanceType<typeof DistributionCategorySelectEditForm> | null>(null)

const onSave = () => {
  onUpdate(
    false,
    () => editForm.value?.validateAll() ?? true,
    async () => {
      // Re-baseline the options editor against the saved response so its rows lose the unsaved markers.
      await nextTick()
      editForm.value?.commit()
    }
  )
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    {
      title: t('breadcrumb.coreDam.distributionCategorySelect.list'),
      routeName: '/(coreDam)/distribution-category-selects',
    },
    {
      title: distributionCategorySelect.value.id || t('breadcrumb.coreDam.distributionCategorySelect.edit'),
      routeName: '/(coreDam)/distribution-category-selects/[id]/edit',
    },
  ])
)

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onSave"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/distribution-category-selects'"
        :skip-route-names="['/(coreDam)/distribution-category-selects/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectEditForm
        v-if="!detailLoading"
        ref="editForm"
      />
    </VCardText>
  </ACard>
  <AUnsavedConfirmDialog
    v-model="guard.promptOpen.value"
    :dirty-labels="guard.dirtyLabels.value"
    @resolve="guard.resolvePrompt"
  />
</template>
