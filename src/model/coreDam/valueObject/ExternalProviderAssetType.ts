import { useDamConfigStore } from '@anzusystems/common-admin'

export function useExternalProviderAssetType() {
  const damConfigStore = useDamConfigStore()
  const { damPrvConfig } = storeToRefs(damConfigStore)
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
