import { ref } from 'vue'
import { useDamConfigState, type ValueObjectOption } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

export function useExternalProviderAssetType() {
  const { damPrvConfig } = useDamConfigState(damClient)
  const all = Object.entries(damPrvConfig.value.assetExternalProviders).map(
    ([providerName, value]): ValueObjectOption<string> => {
      return {
        value: providerName,
        title: value.title,
      }
    }
  )

  const allExternalProviderAssetTypeOptions = ref<ValueObjectOption<string>[]>(all)

  const getExternalProviderAssetTypeOption = (value: string) => {
    return allExternalProviderAssetTypeOptions.value.find((item) => item.value === value)
  }

  return {
    allExternalProviderAssetTypeOptions,
    getExternalProviderAssetTypeOption,
  }
}
