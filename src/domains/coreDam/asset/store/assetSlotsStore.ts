import { cloneDeep, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { damClient } from '@/shared/apiClients/damClient'

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

  /*
   * The asset the rows belong to. The list is shared by all detail
   * parts that read it (Slots tab, slot selects in cards and dialogs).
   * Rows of another asset left in it would be drawn there and act on that asset's files.
   */
  let listOf: DocId | null = null

  /**
   * Switches the list to this asset. Rows of another asset are dropped at once, before anything draws them.
   */
  function holdListOf(assetId: DocId) {
    if (listOf === assetId) return
    listOf = assetId
    list.value = []
  }

  /*
   * The list and loader are shared across assets. A slots request can be
   * answered after the detail switched assets, or after a later request.
   * So each loader raise is counted, and only the latest raise is awaited.
   */
  let loaderRaised = 0

  /**
   * Returns the raise count, to pass to `isAwaited` and `hideLoader`.
   */
  function showLoader() {
    loader.value = true

    return ++loaderRaised
  }

  /**
   * Whether the loader has not gone up for anything else since it went up at `raised`.
   */
  function isAwaited(raised: number) {
    return raised === loaderRaised
  }

  /**
   * Lowered only for the latest raise. Otherwise rows would be drawn before a newer request's answer.
   */
  function hideLoader(raised: number) {
    if (isAwaited(raised)) loader.value = false
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

  function setList(items: Array<AssetSlot>, assetId: DocId) {
    listOf = assetId
    list.value = items
  }

  function reset() {
    listOf = null
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
    isAwaited,
    hideLoader,
    holdListOf,
    setAssetSlotsNamesFromConfig,
    setList,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetSlotsStore, import.meta.hot))
}
