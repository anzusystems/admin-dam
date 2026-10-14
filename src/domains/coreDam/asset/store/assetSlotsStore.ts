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

  /* The asset the rows of the list are of. Every part of a detail that reads them - its Slots tab, the select of a
   * slot of its cards and dialogs - is of the asset the detail holds, and the list is one for them all: rows of
   * another asset left in it would be drawn there, and act on the files of that asset. */
  let listOf: DocId | null = null

  /** The list is of the asset from now on: the rows of another one are dropped at once, before anything draws them. */
  function holdListOf(assetId: DocId) {
    if (listOf === assetId) return
    listOf = assetId
    list.value = []
  }

  /* The list and its loader are one for the slots of every asset, and what is asked about the slots of one asset can
   * be answered once the detail is of another, or after the answer to what was asked later. So each time the loader
   * goes up is counted: what it went up for last is all the list waits for. */
  let loaderRaised = 0

  /** Answers the count the loader went up at: what `isAwaited` and `hideLoader` are asked with. */
  function showLoader() {
    loader.value = true

    return ++loaderRaised
  }

  /** Whether the loader has not gone up for anything else since it went up at `raised`. */
  function isAwaited(raised: number) {
    return raised === loaderRaised
  }

  /** Down only for what it went up for last: under something asked since, the rows would be drawn before its answer. */
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
