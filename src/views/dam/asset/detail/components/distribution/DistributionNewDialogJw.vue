<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/dam/DamConfig'
import { createJwDistribution, ENTITY, prepareFormDataJwDistribution } from '@/services/api/dam/distributionJwApi'
import type { DocId } from '@anzusystems/common-admin'
import { DocIdNullable } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import { useDistributionJwFactory } from '@/model/dam/factory/DistributionJw'
import type { DistributionJwCreateDto } from '@/types/dam/Distribution'
import { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import ATextField from '@/components/form/ATextField.vue'
import { useI18n } from 'vue-i18n'
import ATextarea from '@/components/form/ATextarea.vue'
import AssetDetailSlotSelect from '@/views/dam/asset/detail/components/AssetDetailSlotSelect.vue'
import { fetchAssetFileDistributionList } from '@/services/api/dam/distributionApi'
import { usePagination } from '@/composables/system/pagination'
import { useDistributionFilter } from '@/model/dam/filter/DistributionFilter'
import DistributionListItem from '@/views/dam/asset/detail/components/distribution/DistributionListItem.vue'
import { AssetSlot } from '@/types/dam/AssetSlot'

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

const { createCreateDto } = useDistributionJwFactory()
const distribution = ref<DistributionJwCreateDto>(createCreateDto())

const canDisplayForm = ref(false)
const saving = ref(false)

const assetDetailStore = useAssetDetailStore()
const pagination = usePagination()
const filter = useDistributionFilter()

const loadFormData = async () => {
  canDisplayForm.value = false
  if (!assetFileId.value) return
  existingDistributions.value = await fetchAssetFileDistributionList(assetFileId.value, pagination, filter)
  if (existingDistributions.value.length > 0) return
  const res = await prepareFormDataJwDistribution(assetFileId.value, props.distributionServiceName)
  distribution.value = {
    distributionService: props.distributionServiceName,
    texts: {
      title: res.texts.title,
      description: res.texts.description,
      author: res.texts.author,
      keywords: res.texts.keywords,
    },
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
    await createJwDistribution(assetFileId.value, distribution.value)
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
        <VRow class="mb-2">
          <VCol>
            <ATextarea v-model="distribution.texts.title" :v="v$.distribution.texts.title" required></ATextarea>
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <ATextarea
              v-model="distribution.texts.description"
              :v="v$.distribution.texts.description"
              required
            ></ATextarea>
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <ATextField v-model="distribution.texts.author" :v="v$.distribution.texts.author" required></ATextField>
          </VCol>
        </VRow>
        <VRow class="mb-2">
          <VCol>
            <VCombobox
              :label="t('coreDam.jwDistribution.model.texts.keywords')"
              v-model="distribution.texts.keywords"
              :items="[]"
              multiple
              chips
              closable-chips
            ></VCombobox>
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
    <VBtn color="success" @click.stop="submit" v-if="canDisplayForm" :loading="saving">
      {{ t('common.button.add') }}
    </VBtn>
    <VBtn text @click.stop="closeDialog(false)">{{ t('common.button.cancel') }}</VBtn>
  </VCardActions>
</template>
