<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ABtn from '@/components/common/buttons/ABtn.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/permissionGroupApi'
import { useDistributionCategoryValidation } from '@/views/dam/distributionCategory/composables/distributionCategoryValidation'
import { useDistributionCategoryCreateActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import { AssetType, useAssetType } from '@/model/dam/valueObject/AssetType'
import DistributionCategorySelectOptionSelect from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectOptionSelect.vue'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'

const props = withDefaults(
  defineProps<{
    initialAssetType: AssetType
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
  (e: 'onCreateSuccess', data: AssetType): void
}>()

const dialog = ref(false)

const {
  distributionCategory,
  distributionCategorySelects,
  distributionCategorySelectedOptions,
  loaded,
  prepareData,
  onCreate,
  resetStore,
} = useDistributionCategoryCreateActions()

const onClick = async () => {
  prepareData(props.initialAssetType)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
  resetStore()
}

const onConfirm = () => {
  onCreate(() => {
    emit('onCreateSuccess', distributionCategory.value.type)
    dialog.value = false
    resetStore()
  })
}

const assetTypeComputed = computed(() => distributionCategory.value.type)

const { v$ } = useDistributionCategoryValidation(distributionCategory)
const { t } = useI18n({ useScope: 'global' })

watch(assetTypeComputed, (newValue) => {
  prepareData(newValue)
  v$.value.$reset()
})

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <VBtn :class="buttonClass" :data-cy="dataCy" color="success" rounded="pill" @click.stop="onClick">
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent no-click-animation>
    <VCard v-if="dialog" :loading="!loaded" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.permissionGroup.meta.create') }}</span>
        <VSpacer></VSpacer>
        <VBtn
          class="ml-2"
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="onCancel"
          data-cy="button-close"
        ></VBtn>
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AValueObjectOptionsSelect
              v-model="distributionCategory.type"
              :items="assetTypeOptions"
              data-cy="category-type"
            ></AValueObjectOptionsSelect>
          </ARow>
          <ARow>
            <ATextField
              v-model="distributionCategory.name"
              :v="v$.distributionCategory.name"
              data-cy="category-name"
            ></ATextField>
          </ARow>
          <ARow
            class="mt-5"
            v-for="distributionCategorySelect in distributionCategorySelects"
            :key="distributionCategorySelect.serviceSlug"
          >
            <DistributionCategorySelectOptionSelect
              v-model="distributionCategorySelectedOptions[distributionCategorySelect.serviceSlug]"
              :select="distributionCategorySelect"
            >
            </DistributionCategorySelectOptionSelect>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-confirm">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
