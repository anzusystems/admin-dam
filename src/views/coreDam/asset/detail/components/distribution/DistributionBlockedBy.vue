<script setup lang="ts">
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/coreDam/DamConfig'
import { DistributionRequirementStrategy } from '@/types/coreDam/DamConfig'
import { computed, ref, watch } from 'vue'
import { type DocIdNullable, simpleCloneObject, usePagination, useValidateRequired } from '@anzusystems/common-admin'
import { fetchAssetFileDistributionList } from '@/services/api/coreDam/distributionApi'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import { useDistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import useVuelidate, { type ErrorObject } from '@vuelidate/core'

// now only supports strategy AtLeastOne, as BE too

const props = withDefaults(
  defineProps<{
    modelValue: any
    distributionServiceName: DistributionServiceName
    config: DistributionRequirementsConfig
    assetFileId: DocIdNullable
    assetType: AssetType
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
    emit('update:modelValue', simpleCloneObject(newValue))
  },
})
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

const itemsComputed = computed(() => {
  return distributions.value.map((item) => {
    return {
      title:
        (damConfigExtSystem[props.assetType]?.distribution.distributionRequirements[item.distributionService]?.title ||
          item.distributionService) + ` (${getDistributionStatusOption(item.status)?.title})`,
      value: item.id,
    }
  })
})

const required = useValidateRequired()

const rules = computed(() => {
  if (props.config.strategy === DistributionRequirementStrategy.AtLeastOne) {
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
  <div v-if="config.strategy === DistributionRequirementStrategy.AtLeastOne">
    <VSelect v-model="value" multiple :items="itemsComputed" :error-messages="errorMessageComputed" @blur="onBlur">
      <template #label>Blocked by distribution<span class="required" /></template>
    </VSelect>
  </div>
  <div v-else></div>
</template>
