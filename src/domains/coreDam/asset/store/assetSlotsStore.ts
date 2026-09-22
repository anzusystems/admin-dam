import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { type DamAssetTypeType, useDamConfigState } from '@anzusystems/common-admin'

export const useAssetSlotsStore = defineStore('damAssetSlotsStore', () => {
  const assetSlotNames = ref<string[]>([])
  const list = ref<Array<AssetSlot>>([])
  const loader = ref(false)

  const getPositionedSlots = computed(() => {
    const data: Record<string, null | AssetSlot> = {}
    for (let i = 0; i < assetSlotNames.value.length; i++) {
      const found = list.value.find((item) => item.slotName === assetSlotNames.value[i])
      data[assetSlotNames.value[i]] = found ? found : null
    }
    return data
  })

  function showLoader() {
    loader.value = true
  }

  function hideLoader() {
    loader.value = false
  }

  function setAssetSlotsNamesFromConfig(assetType: DamAssetTypeType) {
    const { getDamConfigExtSystem } = useDamConfigState(damClient)
    const { currentExtSystemId } = useCurrentExtSystem()
    const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
    if (isUndefined(configExtSystem)) {
      throw new Error('Ext system must be initialised.')
    }
    assetSlotNames.value = cloneDeep(configExtSystem[assetType]?.slots ?? [])
  }

  function setList(items: Array<AssetSlot>) {
    list.value = items
  }

  function reset() {
    list.value = []
    assetSlotNames.value = []
    loader.value = false
  }

  return {
    assetSlotNames,
    list,
    loader,
    getPositionedSlots,
    showLoader,
    hideLoader,
    setAssetSlotsNamesFromConfig,
    setList,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetSlotsStore, import.meta.hot))
}
