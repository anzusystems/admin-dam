<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import DistributionCategorySelect from '@/views/dam/distributionCategory/components/DistributionCategorySelect.vue'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY, fetchDistributionCategory } from '@/services/api/dam/distributionCategoryApi'
import { ARow } from '@anzusystems/common-admin'
import { useErrorHandler } from '@anzusystems/common-admin'
import { updateAssetCategory } from '@/services/api/dam/assetApi'
import type { DistributionCategory } from '@/types/dam/DistributionCategory'
import { useDistributionCategoryFactory } from '@/model/dam/factory/DistributionCategoryFactory'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { isNull } from '@anzusystems/common-admin'

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

const { handleError } = useErrorHandler()

const onConfirm = async () => {
  saving.value = true
  const idCache = selectedCategoryId.value
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
  <VDialog v-model="dialogComputed" persistent :width="500" no-click-animation>
    <VCard v-if="dialogComputed" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Manage distribution category</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" @click.stop="onCancel" />
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
            </ARow>
            <ARow>
              <div v-for="item in category.selectedOptionsDetail" :key="item.id">
                <div>{{ item.serviceSlug }} - {{ item.name }}</div>
              </div>
            </ARow>
          </VContainer>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" text data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="primary" :loading="saving" data-cy="button-confirm" @click.stop="onConfirm">
          {{ t('common.button.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
