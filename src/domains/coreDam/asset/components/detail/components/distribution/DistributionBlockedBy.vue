<script setup lang="ts">
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useDistributionFilter } from '@/domains/coreDam/asset/filter/DistributionFilter'
import { useDistributionStatus } from '@/domains/coreDam/asset/valueObject/DamDistributionStatus'
import { damClient } from '@/shared/apiClients/damClient'
import { fetchAssetFileDistributionList } from '@/domains/coreDam/asset/api/distributionApi'
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import {
  type DamAssetTypeType,
  type DamDistributionRequirementsConfig,
  DamDistributionRequirementStrategy,
  type DamDistributionServiceName,
  type DocIdNullable,
  useDamConfigState,
} from '@anzusystems/common-admin'
import { usePagination } from '@anzusystems/common-admin/labs'
import useVuelidate, { type ErrorObject } from '@vuelidate/core'

// now only supports strategy AtLeastOne, as BE too

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    distributionServiceName: DamDistributionServiceName
    config: DamDistributionRequirementsConfig
    assetFileId: DocIdNullable
    assetType: DamAssetTypeType
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', cloneDeep(newValue))
  },
})

const { t } = useI18n()

const { getDistributionStatusOption } = useDistributionStatus()
const { pagination } = usePagination(null)
const { filterConfig, filterData } = useDistributionFilter()
const distributions = ref<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>([])

const loadDistributions = async (fileId: DocIdNullable) => {
  if (!fileId) return
  filterData.distributionServicesIn = props.config.blockedBy
  filterData.distributionServicesNotIn = [props.distributionServiceName]
  distributions.value = await fetchAssetFileDistributionList<DistributionJwItem>(
    fileId,
    pagination,
    filterData,
    filterConfig
  )
}

const assetFileIdComputed = computed(() => {
  return props.assetFileId
})

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const itemsComputed = computed(() => {
  return distributions.value.map((item) => {
    return {
      title:
        (configExtSystem[props.assetType]?.distribution?.distributionRequirements[item.distributionService]?.title ??
          item.distributionService) + ` (${getDistributionStatusOption(item.status)?.title})`,
      value: item.id,
    }
  })
})

const { requiredIf } = useValidate()

const rules = computed(() => {
  return {
    modelValueComputed: {
      required: requiredIf(props.config.strategy === DamDistributionRequirementStrategy.AtLeastOne),
    },
  }
})

const v$ = useVuelidate(rules, { modelValueComputed })

const onBlur = () => {
  v$.value.$touch()
}

const errorMessageComputed = computed(() => {
  if (v$.value.$errors?.length) return [v$.value.$errors.map((item: ErrorObject) => item.$message).join(' ')]
  return []
})

watch(
  assetFileIdComputed,
  async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      await loadDistributions(newValue)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="config.blockedBy.length > 0">
    <VSelect
      v-model="modelValueComputed"
      multiple
      :items="itemsComputed"
      :error-messages="errorMessageComputed"
      @blur="onBlur"
    >
      <template #label>
        {{ t('coreDam.distribution.common.blockedByDistribution') }}<span class="required" />
      </template>
    </VSelect>
  </div>
  <div v-else />
</template>
