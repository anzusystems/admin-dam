<script lang="ts" setup>
import { useDistributionCustomFactory } from '@/model/coreDam/factory/DistributionCustomFactory'
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { damClient } from '@/services/api/clients/damClient'
import { fetchAssetFileDistributionList } from '@/services/api/coreDam/distributionApi'
import {
  createCustomDistribution,
  prepareFormDataCustomDistribution,
  redistributeCustomDistribution,
} from '@/services/api/coreDam/distributionCustomApi'
import { ENTITY } from '@/services/api/coreDam/distributionJwApi'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import type { DistributionCustomCreateRedistributeDto, DistributionCustomItem } from '@/types/coreDam/Distribution'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import DistributionBlockedBy from '@/views/coreDam/asset/detail/components/distribution/DistributionBlockedBy.vue'
import DistributionCustomMetadataForm from '@/views/coreDam/asset/detail/components/distribution/DistributionCustomMetadataForm.vue'
import DistributionListItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItem.vue'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'
import {
  AFormDatetimePicker,
  AssetFileProcessStatus,
  ASystemEntityScope,
  cloneDeep,
  type DamAssetTypeType,
  type DamDistributionRequirementsConfig,
  type DamDistributionServiceName,
  type DocId,
  isUndefined,
  useAlerts,
  useDamConfigState,
  useDamConfigStore,
  usePagination,
} from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    assetType: DamAssetTypeType
    config: DamDistributionRequirementsConfig
    assetId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'closeDialog', reloadList: boolean): void
}>()

const existingDistributions = ref<Array<DistributionCustomItem>>([])

const { t } = useI18n()

const { createCreateDto } = useDistributionCustomFactory()
const distribution = ref<DistributionCustomCreateRedistributeDto>(createCreateDto())
const { redistributeMode, assetFileId, assetFileStatus, redistributeId } = useAssetDetailDistributionDialog()

const canDisplayForm = ref(false)
const saving = ref(false)

const pagination = usePagination()
const filter = useDistributionFilter()

const { showRecordWas, showValidationError, showErrorsDefault, showUnknownError } = useAlerts()

const { loadDamConfigDistributionCustomFormElements } = useDamConfigState(damClient)
const damConfigStore = useDamConfigStore()
const { damConfigDistributionCustomFormElements } = storeToRefs(damConfigStore)

const loadFormData = async () => {
  canDisplayForm.value = false
  try {
    await loadDamConfigDistributionCustomFormElements(props.distributionServiceName)
  } catch (e) {
    showUnknownError()
  }
  const configDistributionCustomFormElements = damConfigDistributionCustomFormElements.value.get(
    props.distributionServiceName
  )
  if (isUndefined(configDistributionCustomFormElements)) return
  if (!assetFileId.value || assetFileStatus.value !== AssetFileProcessStatus.Processed) return
  filter.distributionService.model = props.distributionServiceName
  filter.id.model = redistributeId.value
  existingDistributions.value = await fetchAssetFileDistributionList<DistributionCustomItem>(
    assetFileId.value,
    pagination,
    filter
  )
  if (!redistributeMode.value && existingDistributions.value.length > 0) return
  if (redistributeMode.value && existingDistributions.value[0]) {
    distribution.value = {
      id: existingDistributions.value[0].id,
      distributionService: props.distributionServiceName,
      customData: cloneDeep(existingDistributions.value[0].customData),
      blockedBy: existingDistributions.value[0].blockedBy,
      publishAt: existingDistributions.value[0].publishAt,
    }
    canDisplayForm.value = true
    return
  }
  const res = await prepareFormDataCustomDistribution(assetFileId.value, props.distributionServiceName)
  distribution.value = {
    id: '',
    distributionService: props.distributionServiceName,
    customData: res.customData,
    blockedBy: res.blockedBy,
    publishAt: res.publishAt,
  }
  canDisplayForm.value = true
}

const closeDialog = (reload = false) => {
  emit('closeDialog', reload)
}

const rules = computed(() => ({
  distribution: {
    distributionService: {},
    publishAt: {},
  },
}))
const v$ = useVuelidate(rules, { distribution })

const submitRedistribute = async () => {
  if (!existingDistributions.value[0]?.id) return
  saving.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saving.value = false
    return
  }
  try {
    await redistributeCustomDistribution(existingDistributions.value[0].id, distribution.value)
    showRecordWas('updated')
    await loadFormData()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const submitCreateNew = async () => {
  if (!assetFileId.value) return
  saving.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saving.value = false
    return
  }
  try {
    await createCustomDistribution(assetFileId.value, distribution.value)
    showRecordWas('created')
    await loadFormData()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const submit = () => {
  if (redistributeMode.value) {
    submitRedistribute()
    return
  }
  submitCreateNew()
}

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  assetFileId.value = slot.assetFile.id
  assetFileStatus.value = slot.assetFile.fileAttributes.status
  existingDistributions.value = []
  await loadFormData()
}

onMounted(async () => {
  await loadFormData()
})
</script>

<template>
  <VCardText>
    <VRow
      v-if="!redistributeMode"
      class="mb-6"
    >
      <VCol>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
      </VCol>
    </VRow>
    <div
      v-if="assetFileStatus !== AssetFileProcessStatus.Processed"
      class="d-flex w-100 h-100 justify-center align-center pa-2"
    >
      {{ t('coreDam.distribution.common.assetFileStatusCantDistribute') }}
    </div>
    <div v-else-if="!redistributeMode && existingDistributions.length > 0">
      <DistributionListItem
        v-for="item in existingDistributions"
        :key="item.id"
        :item="item"
        :asset-type="assetType"
      />
    </div>
    <div
      v-else-if="canDisplayForm"
      class="pa-4"
    >
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <DistributionCustomMetadataForm
          v-model="distribution.customData"
          :distribution-service-name="distributionServiceName"
        />
        <VRow class="mb-2">
          <VCol>
            <DistributionBlockedBy
              v-model="distribution.blockedBy"
              :config="config"
              :distribution-service-name="distributionServiceName"
              :asset-file-id="assetFileId"
              :asset-type="assetType"
            />
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <AFormDatetimePicker
              v-model="distribution.publishAt"
              :label="t('coreDam.distribution.model.publishAt')"
            />
          </VCol>
        </VRow>
      </ASystemEntityScope>
    </div>
    <div
      v-else
      class="d-flex w-100 h-100 justify-center align-center pa-2"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
  </VCardText>
  <VCardActions>
    <VSpacer />
    <ABtnTertiary
      variant="text"
      @click.stop="closeDialog(false)"
    >
      {{ t('common.button.cancel') }}
    </ABtnTertiary>
    <ABtnPrimary
      v-if="canDisplayForm"
      :loading="saving"
      @click.stop="submit"
    >
      <span v-if="redistributeMode">{{ t('common.button.confirm') }}</span>
      <span v-else>{{ t('common.button.add') }}</span>
    </ABtnPrimary>
  </VCardActions>
</template>
