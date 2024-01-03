import { ref } from 'vue'
import { useDamConfigState, type ValueObjectOption } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

export function useDistributionServiceType() {
  const { damPrvConfig } = useDamConfigState(damClient)
  const all = Object.entries(damPrvConfig.value.distributionServices).map(
    ([serviceName, value]): ValueObjectOption<string> => {
      return {
        value: serviceName,
        title: value.title,
      }
    }
  )

  const allDistributionServiceTypeOptions = ref<ValueObjectOption<string>[]>(all)

  const getDistributionServiceTypeOption = (value: string) => {
    return allDistributionServiceTypeOptions.value.find((item) => item.value === value)
  }

  return {
    allDistributionServiceTypeOptions,
    getDistributionServiceTypeOption,
  }
}
