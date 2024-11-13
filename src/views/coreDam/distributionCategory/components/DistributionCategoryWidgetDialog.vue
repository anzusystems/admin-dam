<script lang="ts" setup>
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useDistributionCategoryFactory } from '@/model/coreDam/factory/DistributionCategoryFactory'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { updateAssetCategory } from '@/services/api/coreDam/assetApi'
import { ENTITY, fetchDistributionCategory } from '@/services/api/coreDam/distributionCategoryApi'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import DistributionCategoryRemoteAutocomplete from '@/views/coreDam/distributionCategory/components/DistributionCategoryRemoteAutocomplete.vue'
import type { DamAssetTypeType, DocId, DocIdNullable } from '@anzusystems/common-admin'
import { ADialogToolbar, ARow, ASystemEntityScope, isNull, useAlerts } from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    categoryId?: DocIdNullable
    assetId: DocId
    assetType: DamAssetTypeType
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

const { t } = useI18n()

const { createDefault } = useDistributionCategoryFactory()
const { currentExtSystemId } = useCurrentExtSystem()

const selectedCategoryId = ref<DocIdNullable>(null)
const saving = ref(false)
const category = ref<DistributionCategory>(createDefault(currentExtSystemId.value))

const dialogComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: boolean) {
    emit('update:modelValue', newValue)
  },
})

const { showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  saving.value = true
  const idCache = selectedCategoryId.value
  try {
    await updateAssetCategory(props.assetId, idCache)
    dialogComputed.value = false
    emit('afterSave', idCache)
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    saving.value = false
  }
}

const loadCategory = async (id: DocId) => {
  category.value = createDefault(currentExtSystemId.value)
  category.value = await fetchDistributionCategory(id)
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

watch(
  selectedCategoryId,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    if (isNull(newValue)) {
      category.value = createDefault(currentExtSystemId.value)
      return
    }
    loadCategory(newValue)
  },
  { immediate: true }
)
</script>

<template>
  <VDialog
    v-model="dialogComputed"
    :width="500"
  >
    <VCard
      v-if="dialogComputed"
      data-cy="delete-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('coreDam.distributionCategory.manage') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <DistributionCategoryRemoteAutocomplete
              v-model="selectedCategoryId"
              :asset-type="assetType"
              clearable
              :label="t('coreDam.asset.model.distributionCategory')"
            />
          </ARow>
          <ARow>
            <div
              v-for="item in category.selectedOptionsDetail"
              :key="item.id"
            >
              <div>{{ item.serviceSlug }} - {{ item.name }}</div>
            </div>
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="saving"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
