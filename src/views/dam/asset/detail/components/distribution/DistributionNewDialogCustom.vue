<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/dam/DamConfig'
import { ENTITY } from '@/services/api/dam/distributionJwApi'
import type { DocId } from '@anzusystems/common-admin'
import { DocIdNullable } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import useVuelidate from '@vuelidate/core'
import type { DistributionCustomCreateDto } from '@/types/dam/Distribution'
import { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useI18n } from 'vue-i18n'
import AssetDetailSlotSelect from '@/views/dam/asset/detail/components/AssetDetailSlotSelect.vue'
import { fetchAssetFileDistributionList } from '@/services/api/dam/distributionApi'
import { usePagination } from '@/composables/system/pagination'
import { useDistributionFilter } from '@/model/dam/filter/DistributionFilter'
import DistributionListItem from '@/views/dam/asset/detail/components/distribution/DistributionListItem.vue'
import { AssetSlot } from '@/types/dam/AssetSlot'
import { createCustomDistribution, prepareFormDataCustomDistribution } from '@/services/api/dam/distributionCustomApi'
import { useDistributionCustomFactory } from '@/model/dam/factory/DistributionCustom'
import {
  damConfigDistributionCustomFormElements,
  loadDamConfigDistributionCustomFormElements,
} from '@/services/DamConfigDistributionCustomFormService'
import DistributionCustomMetadataForm from '@/views/dam/asset/detail/components/distribution/DistributionCustomMetadataForm.vue'

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

const assetFileId = ref<DocIdNullable>(null)
const existingDistributions = ref<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>([])

const { t } = useI18n({ useScope: 'global' })

const { createCreateDto } = useDistributionCustomFactory()
const distribution = ref<DistributionCustomCreateDto>(createCreateDto())

const canDisplayForm = ref(false)
const saving = ref(false)

const assetDetailStore = useAssetDetailStore()
const pagination = usePagination()
const filter = useDistributionFilter()

const loadFormData = async () => {
  canDisplayForm.value = false
  await loadDamConfigDistributionCustomFormElements(props.distributionServiceName)
  if (!damConfigDistributionCustomFormElements.value[props.distributionServiceName]) return
  if (!assetFileId.value) return
  existingDistributions.value = await fetchAssetFileDistributionList(assetFileId.value, pagination, filter)
  if (existingDistributions.value.length > 0) return
  const res = await prepareFormDataCustomDistribution(assetFileId.value, props.distributionServiceName)
  distribution.value = {
    distributionService: props.distributionServiceName,
    customData: res.customData,
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
    distributionService: '',
  },
}))
const v$ = useVuelidate(rules, { distribution })

const submit = async () => {
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

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  assetFileId.value = slot.assetFile.id
  existingDistributions.value = []
  await loadFormData()
}

onMounted(async () => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile) {
    assetFileId.value = assetDetailStore.asset.mainFile.id
  }
  await loadFormData()
})
</script>

<template>
  <VCardText>
    <VRow class="mb-6">
      <VCol>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
      </VCol>
    </VRow>
    <div v-if="existingDistributions.length > 0">
      <DistributionListItem v-for="item in existingDistributions" :key="item.id" :item="item" :asset-type="assetType" />
    </div>
    <div v-else-if="canDisplayForm" class="pa-4">
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <DistributionCustomMetadataForm
          v-model="distribution.customData"
          :distribution-service-name="distributionServiceName"
        />
      </ASystemEntityScope>
    </div>
    <div v-else class="d-flex w-100 h-100 justify-center align-center pa-2">
      <VProgressCircular indeterminate color="primary" />
    </div>
  </VCardText>
  <VCardActions>
    <VSpacer />
    <VBtn v-if="canDisplayForm" color="success" :loading="saving" @click.stop="submit">
      {{ t('common.button.add') }}
    </VBtn>
    <VBtn text @click.stop="closeDialog(false)">{{ t('common.button.cancel') }}</VBtn>
  </VCardActions>
</template>
