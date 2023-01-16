<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import DistributionCategorySelect from '@/views/dam/distributionCategory/components/DistributionCategorySelect.vue'
import type { DocId, DocIdNullable } from '@/types/common'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategoryApi'
import ARow from '@/components/common/ARow.vue'
import { useErrorHandler } from '@/composables/system/error'
import { updateAssetCategory } from '@/services/api/dam/assetApi'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    categoryId?: DocIdNullable
    assetId: DocId
  }>(),
  {
    modelValue: false,
    categoryId: null,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
  (e: 'afterSave', data: DocIdNullable): void
}>()

const { t } = useI18n({ useScope: 'global' })

const selectedCategoryId = ref<DocIdNullable>(null)
const saving = ref(false)

const dialogComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: boolean) {
    emit('update:modelValue', newValue)
  },
})

const { handleError } = useErrorHandler()

const onConfirm = async () => {
  saving.value = true
  const idCache = props.categoryId
  try {
    await updateAssetCategory(props.assetId, idCache)
    dialogComputed.value = false
    emit('afterSave', idCache)
  } catch (e) {
    handleError(e)
  } finally {
    saving.value = false
  }
}
const onCancel = () => {
  dialogComputed.value = false
}

watch(
  dialogComputed,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      selectedCategoryId.value = props.categoryId
    }
  },
  { immediate: true }
)
</script>

<template>
  <VDialog v-model="dialogComputed" persistent :width="500" no-click-animation>
    <VCard v-if="dialogComputed" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Manage distribution category</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" @click.stop="onCancel"></VBtn>
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
          <VContainer class="pa-4" fluid>
            <ARow>
              <DistributionCategorySelect
                v-model="selectedCategoryId"
                clearable
                :label="t('coreDam.asset.model.distributionCategory')"
              />
              {{ selectedCategoryId }}
            </ARow>
          </VContainer>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="secondary" text @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="primary" @click.stop="onConfirm" :loading="saving" data-cy="button-confirm">
          {{ t('common.button.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
