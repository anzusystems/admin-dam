<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/dam/DamConfig'
import { ENTITY } from '@/services/api/dam/distributionJwApi'
import type { DocId } from '@anzusystems/common-admin'
import {
  ASystemEntityScope,
  simpleCloneObject,
  useAlerts,
  useErrorHandler,
  usePagination,
} from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import type { DistributionCustomCreateRedistributeDto, DistributionCustomItem } from '@/types/dam/Distribution'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useI18n } from 'vue-i18n'
import AssetDetailSlotSelect from '@/views/dam/asset/detail/components/AssetDetailSlotSelect.vue'
import { fetchAssetFileDistributionList } from '@/services/api/dam/distributionApi'
import { useDistributionFilter } from '@/model/dam/filter/DistributionFilter'
import DistributionListItem from '@/views/dam/asset/detail/components/distribution/DistributionListItem.vue'
import type { AssetSlot } from '@/types/dam/AssetSlot'
import {
  createCustomDistribution,
  prepareFormDataCustomDistribution,
  redistributeCustomDistribution,
} from '@/services/api/dam/distributionCustomApi'
import { useDistributionCustomFactory } from '@/model/dam/factory/DistributionCustom'
import {
  damConfigDistributionCustomFormElements,
  loadDamConfigDistributionCustomFormElements,
} from '@/services/DamConfigDistributionCustomFormService'
import DistributionCustomMetadataForm from '@/views/dam/asset/detail/components/distribution/DistributionCustomMetadataForm.vue'
import { useAssetDetailDistributionDialog } from '@/views/dam/asset/detail/composables/assetDetailDistributionDialog'
import DistributionBlockedBy from '@/views/dam/asset/detail/components/distribution/DistributionBlockedBy.vue'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DistributionServiceName
    assetType: AssetType
    config: DistributionRequirementsConfig
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
const { redistributeMode, assetFileId } = useAssetDetailDistributionDialog()

const canDisplayForm = ref(false)
const saving = ref(false)

const pagination = usePagination()
const filter = useDistributionFilter()

const loadFormData = async () => {
  canDisplayForm.value = false
  await loadDamConfigDistributionCustomFormElements(props.distributionServiceName)
  if (!damConfigDistributionCustomFormElements.value[props.distributionServiceName]) return
  if (!assetFileId.value) return
  filter.distributionService.model = props.distributionServiceName
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
      customData: simpleCloneObject(existingDistributions.value[0].customData),
      blockedBy: existingDistributions.value[0].blockedBy,
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
  }
  canDisplayForm.value = true
}

const closeDialog = (reload = false) => {
  emit('closeDialog', reload)
}

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()

const rules = computed(() => ({
  distribution: {
    distributionService: {},
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
    closeDialog(true)
  } catch (error) {
    handleError(error)
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
    closeDialog(true)
  } catch (error) {
    handleError(error)
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
  existingDistributions.value = []
  await loadFormData()
}

onMounted(async () => {
  await loadFormData()
})
</script>

<template>
  <VCardText>
    <VRow v-if="!redistributeMode" class="mb-6">
      <VCol>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
      </VCol>
    </VRow>
    <div v-if="!redistributeMode && existingDistributions.length > 0">
      <DistributionListItem v-for="item in existingDistributions" :key="item.id" :item="item" :asset-type="assetType" />
    </div>
    <div v-else-if="canDisplayForm" class="pa-4">
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
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
      </ASystemEntityScope>
    </div>
    <div v-else class="d-flex w-100 h-100 justify-center align-center pa-2">
      <VProgressCircular indeterminate color="primary" />
    </div>
  </VCardText>
  <VCardActions>
    <VSpacer />
    <VBtn v-if="canDisplayForm" color="success" :loading="saving" @click.stop="submit">
      <span v-if="redistributeMode">{{ t('common.button.confirm') }}</span>
      <span v-else>{{ t('common.button.add') }}</span>
    </VBtn>
    <VBtn text @click.stop="closeDialog(false)">{{ t('common.button.cancel') }}</VBtn>
  </VCardActions>
</template>
