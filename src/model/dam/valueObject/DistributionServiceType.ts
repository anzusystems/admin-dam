import { ref } from 'vue'
import type { ValueObjectOption } from '@/types/ValueObject'
import { damConfig } from '@/services/DamConfigService'

export function useDistributionServiceType() {
  const all = Object.entries(damConfig.distributionServices).map(([serviceName, value]): ValueObjectOption<string> => {
    return {
      value: serviceName,
      title: value.title,
    }
  })

  const allDistributionServiceTypeOptions = ref<ValueObjectOption<string>[]>(all)

  const getDistributionServiceTypeOption = (value: string) => {
    return allDistributionServiceTypeOptions.value.find((item) => item.value === value)
  }

  return {
    allDistributionServiceTypeOptions,
    getDistributionServiceTypeOption,
  }
}
