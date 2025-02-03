<script lang="ts" setup>
import {
  ADialogToolbar,
  AFormTextarea,
  AFormValueObjectOptionsSelect,
  AFormTextField,
  ARow,
  useAlerts, type DocId, AnzuApiValidationError
} from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  type DistributionItem,
  DistributionItemResourceName, type DistributionItemResourceNameType,
  type DistributionItemTypes, type DistributionUpdateDto
} from '@/types/coreDam/Distribution.ts'
import DistributionForm from '@/views/coreDam/asset/detail/components/distribution/forms/DistributionForm.vue'
import { DistributionUpdateDtoValidationScopeSymbol } from '@/components/validationScopes.ts'
import {
  useDistributionUpdateDtoValidations
} from '@/views/coreDam/asset/detail/composables/distributionValidations.ts'
import type { AssetSlot } from '@/types/coreDam/AssetSlot.ts'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import { useDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus.ts'
import { upsertAssetDistributions } from '@/services/api/coreDam/distributionApi'

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    isEdit?: boolean
    assetId: DocId
  }>(),
  {
    readonly: false,
    isEdit: false,
  }
)

const emit = defineEmits<{
  (e: 'onDistributionUpsert'): void
  (e: 'onDistributionTypeSelect', data: DistributionItemResourceNameType): void
  (e: 'onCancel'): void
}>()

const distribution = defineModel<DistributionUpdateDto>({ required: true })
const distributionManageDialog = defineModel<boolean>('distributionManageDialog', { required: true })

const { t } = useI18n()

const saveButtonLoading = ref(false)

const onCancel = () => {
  distributionManageDialog.value = false
  emit('onCancel')
}

const { v$ } = useDistributionUpdateDtoValidations(distribution)

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  saveButtonLoading.value = true
  try {
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      saveButtonLoading.value = false
      return
    }
    await upsertAssetDistributions(distribution.value.asset, distribution.value)
    distributionManageDialog.value = false

    showRecordWas(props.isEdit ? 'updated' : 'created')
    emit('onDistributionUpsert')
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saveButtonLoading.value = false
  }
}

const allowedDistributionResourceNames = [
  DistributionItemResourceName.Jw,
  DistributionItemResourceName.Youtube,
]

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  distribution.value.assetFile = slot.assetFile.id
}

const onBlur = () => {
  v$.value.$touch()
}

const { DistributionStatusOptions } = useDistributionStatus()

const onDistributionTypeSelect = (value: DistributionItemResourceNameType) => {
  emit('onDistributionTypeSelect', value)
}

</script>

<template>
  <VDialog
    v-model="distributionManageDialog"
    :width="900"
  >
    <VCard v-if="distributionManageDialog">
<!--      <ADialogToolbar @on-cancel="pageContentManageDialog = false">-->
<!--        <span v-if="pageContent.id">{{ t('cms.pageContent.meta.edit') }}</span>-->
<!--        <span v-else>{{ t('cms.pageContent.meta.create') }}</span>-->
<!--      </ADialogToolbar>-->
      <VCardText class="pb-6">
        <AFormValueObjectOptionsSelect
          v-if="!isEdit"
          v-model="distribution._resourceName"
          :items="allowedDistributionResourceNames"
          :readonly="readonly"
          @update:model-value="onDistributionTypeSelect"
        />
        <ARow>
            <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
        </ARow>
        <ARow>
          <AFormTextField
            :label="t('coreDam.distribution.common.extId')"
            v-model="distribution.extId"
            @blur="onBlur"
            :readonly="readonly"
            :v="v$.distribution.extId"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            :label="t('coreDam.distribution.common.status')"
            v-model="distribution.status"
            :items="DistributionStatusOptions"
            :readonly="readonly"
            :v="v$.distribution.status"
          />
        </ARow>
        <DistributionForm
          v-model="distribution"
          :validation-scope="DistributionUpdateDtoValidationScopeSymbol"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary @click.stop="onConfirm">
          {{ isEdit ? t('common.button.confirm') : t('common.button.create') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
