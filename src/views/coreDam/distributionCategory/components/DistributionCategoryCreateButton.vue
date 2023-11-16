<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DamAssetType } from '@anzusystems/common-admin'
import {
  ADialogToolbar,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  useAlerts,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import { useDistributionCategoryValidation } from '@/views/coreDam/distributionCategory/composables/distributionCategoryValidation'
import { useDistributionCategoryCreateActions } from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategorySelectOptionSelect from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectOptionSelect.vue'
import { useAssetType } from '@/model/coreDam/valueObject/DamAssetType'

const props = withDefaults(
  defineProps<{
    initialAssetType: DamAssetType
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'onCreateSuccess', data: DamAssetType): void
}>()

const dialog = ref(false)

const {
  createFormDataLoaded,
  distributionCategory,
  distributionCategorySelects,
  distributionCategorySelectedOptions,
  prepareData,
  onCreate,
  resetStore,
  createButtonLoading,
} = useDistributionCategoryCreateActions()

const onClick = async () => {
  prepareData(props.initialAssetType)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
  resetStore()
}

const { showValidationError } = useAlerts()

const onConfirm = () => {
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    return
  }
  onCreate(() => {
    emit('onCreateSuccess', distributionCategory.value.type)
    dialog.value = false
    resetStore()
  })
}

const assetTypeComputed = computed(() => distributionCategory.value.type)

const { v$ } = useDistributionCategoryValidation(distributionCategory)
const { t } = useI18n()

watch(assetTypeComputed, (newValue) => {
  prepareData(newValue)
  v$.value.$reset()
})

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <ABtnPrimary
    :class="buttonClass"
    :data-cy="dataCy"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </ABtnPrimary>
  <VDialog
    v-model="dialog"
    :max-width="500"
  >
    <VCard
      v-if="dialog"
      data-cy="create-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('coreDam.distributionCategory.createButton') }}
      </ADialogToolbar>
      <VCardText
        v-if="!createFormDataLoaded"
        class="d-flex w-100 align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </VCardText>
      <VCardText v-else>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="distributionCategory.type"
              :items="assetTypeOptions"
              data-cy="category-type"
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="distributionCategory.name"
              :v="v$.distributionCategory.name"
              data-cy="category-name"
            />
          </ARow>
          <ARow
            v-for="distributionCategorySelect in distributionCategorySelects"
            :key="distributionCategorySelect.serviceSlug"
            class="mt-5"
          >
            <DistributionCategorySelectOptionSelect
              v-model="distributionCategorySelectedOptions[distributionCategorySelect.serviceSlug]"
              :select="distributionCategorySelect"
            />
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
          :loading="createButtonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t(buttonT) }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
