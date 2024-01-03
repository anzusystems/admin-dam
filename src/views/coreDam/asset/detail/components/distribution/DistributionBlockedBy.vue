<script setup lang="ts">
import { type DamAssetType, type DamDistributionRequirementsConfig, isUndefined } from '@anzusystems/common-admin'
import {
  cloneDeep,
  DamDistributionRequirementStrategy,
  type DamDistributionServiceName,
  type DocIdNullable,
  useDamConfigState,
  usePagination,
  useValidate,
} from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import { fetchAssetFileDistributionList } from '@/services/api/coreDam/distributionApi'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import { useDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus'
import useVuelidate, { type ErrorObject } from '@vuelidate/core'
import { useI18n } from 'vue-i18n'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'

// now only supports strategy AtLeastOne, as BE too

const props = withDefaults(
  defineProps<{
    modelValue: any
    distributionServiceName: DamDistributionServiceName
    config: DamDistributionRequirementsConfig
    assetFileId: DocIdNullable
    assetType: DamAssetType
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | null | string[]): void
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', cloneDeep(newValue))
  },
})

const { t } = useI18n()

const { getDistributionStatusOption } = useDistributionStatus()
const pagination = usePagination()
const filter = useDistributionFilter()
const distributions = ref<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>([])

const loadDistributions = async (fileId: DocIdNullable) => {
  if (!fileId) return
  filter.distributionServicesIn.model = props.config.blockedBy
  filter.distributionServicesNotIn.model = [props.distributionServiceName]
  distributions.value = await fetchAssetFileDistributionList<DistributionJwItem>(fileId, pagination, filter)
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
        (configExtSystem[props.assetType]?.distribution.distributionRequirements[item.distributionService]
          ?.title || item.distributionService) + ` (${getDistributionStatusOption(item.status)?.title})`,
      value: item.id,
    }
  })
})

const { required } = useValidate()

const rules = computed(() => {
  if (props.config.strategy === DamDistributionRequirementStrategy.AtLeastOne) {
    return {
      required,
    }
  }
  return {}
})

const v$ = useVuelidate(rules, value)

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
      v-model="value"
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
