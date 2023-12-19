<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type {
  DamAssetType,
  DamDistributionRequirementsConfig,
  DamDistributionServiceName,
} from '@anzusystems/common-admin'
import {
  AFormDatetimePicker,
  AFormTextarea,
  AFormTextField,
  AssetFileProcessStatus,
  ASystemEntityScope,
  type DocId,
  useAlerts,
  usePagination,
  useValidate,
} from '@anzusystems/common-admin'
import {
  createJwDistribution,
  ENTITY,
  prepareFormDataJwDistribution,
  redistributeJwDistribution,
} from '@/services/api/coreDam/distributionJwApi'
import useVuelidate from '@vuelidate/core'
import { useDistributionJwFactory } from '@/model/coreDam/factory/DistributionJwFactory'
import type { DistributionJwCreateRedistributeDto, DistributionJwItem } from '@/types/coreDam/Distribution'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useI18n } from 'vue-i18n'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import { fetchAssetFileDistributionList } from '@/services/api/coreDam/distributionApi'
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import DistributionListItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItem.vue'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'
import DistributionBlockedBy from '@/views/coreDam/asset/detail/components/distribution/DistributionBlockedBy.vue'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    assetType: DamAssetType
    config: DamDistributionRequirementsConfig
    assetId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'closeDialog', reloadList: boolean): void
}>()

const existingDistributions = ref<Array<DistributionJwItem>>([])

const { t } = useI18n()

const { createCreateDto } = useDistributionJwFactory()
const distribution = ref<DistributionJwCreateRedistributeDto>(createCreateDto())
const { redistributeMode, assetFileId, assetFileStatus, redistributeId } = useAssetDetailDistributionDialog()

const canDisplayForm = ref(false)
const saving = ref(false)

const pagination = usePagination()
const filter = useDistributionFilter()

const loadFormData = async () => {
  canDisplayForm.value = false
  if (!assetFileId.value || assetFileStatus.value !== AssetFileProcessStatus.Processed) return
  filter.distributionService.model = props.distributionServiceName
  filter.id.model = redistributeId.value
  existingDistributions.value = await fetchAssetFileDistributionList<DistributionJwItem>(
    assetFileId.value,
    pagination,
    filter
  )
  if (!redistributeMode.value && existingDistributions.value.length > 0) return
  if (redistributeMode.value && existingDistributions.value[0]) {
    distribution.value = {
      id: existingDistributions.value[0].id,
      distributionService: props.distributionServiceName,
      texts: {
        title: existingDistributions.value[0].texts.title,
        description: existingDistributions.value[0].texts.description,
        author: existingDistributions.value[0].texts.author,
        keywords: existingDistributions.value[0].texts.keywords,
      },
      blockedBy: existingDistributions.value[0].blockedBy,
      publishAt: existingDistributions.value[0].publishAt,
    }
    canDisplayForm.value = true
    return
  }
  const res = await prepareFormDataJwDistribution(assetFileId.value, props.distributionServiceName)
  distribution.value = {
    id: '',
    distributionService: props.distributionServiceName,
    texts: {
      title: res.texts.title,
      description: res.texts.description,
      author: res.texts.author,
      keywords: res.texts.keywords,
    },
    blockedBy: res.blockedBy,
    publishAt: res.publishAt,
  }
  canDisplayForm.value = true
}

const closeDialog = (reload = false) => {
  emit('closeDialog', reload)
}

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const { required, minLength, maxLength } = useValidate()

const rules = computed(() => ({
  distribution: {
    texts: {
      title: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(128),
      },
      description: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(5000),
      },
      author: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(256),
      },
    },
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
    await redistributeJwDistribution(existingDistributions.value[0].id, distribution.value)
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
    await createJwDistribution(assetFileId.value, distribution.value)
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
        <VRow class="mb-2">
          <VCol>
            <AFormTextarea
              v-model="distribution.texts.title"
              :v="v$.distribution.texts.title"
              required
            />
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <AFormTextarea
              v-model="distribution.texts.description"
              :v="v$.distribution.texts.description"
              required
            />
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <AFormTextField
              v-model="distribution.texts.author"
              :v="v$.distribution.texts.author"
              required
            />
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <VCombobox
              v-model="distribution.texts.keywords"
              :label="t('coreDam.jwDistribution.model.texts.keywords')"
              :items="[]"
              chips
              multiple
              closable-chips
            />
          </VCol>
        </VRow>
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
    <ABtnTertiary @click.stop="closeDialog(false)">
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
