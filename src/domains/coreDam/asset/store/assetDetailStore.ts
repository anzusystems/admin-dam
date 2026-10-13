import { DamAssetStatus, useAssetSuggestions } from '@anzusystems/common-admin'
import type { AssetDetailItemDto, DocId, DocIdNullable } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'

export const useAssetDetailStore = defineStore('damAssetDetailStore', () => {
  const asset = ref<AssetDetailItemDto | null>(null)
  const authorConflicts = ref<DocId[]>([])
  const loader = ref(false)
  const siblingLoader = ref(false)
  const detail = ref(false)
  const view = ref<'list' | 'queue'>('list')
  const metadataAreTouched = ref(false)
  const directDetailLoad = ref(false)
  const lastFetched = ref(Date.now())
  const lastFetchedId = ref<DocId>('')
  const mainFileSingleUse = ref(false)
  const mainFileOverrideInternal = ref(false)
  const mainFileInternal = ref(false)
  const ttsAudio = ref(false)

  /* Clicks, held-down arrow keys, the queue's edit button and the deep-link view put several detail
   * fetches on the wire at once and they do not come back in order; only the newest may write here.
   * It always reaches its own `finally` and lowers the loader - after `abandonDetailRequests` none
   * is newest, and the loader waits for the reset every component does on mount. */
  let detailRequests = 0
  const startDetailRequest = () => ++detailRequests
  const isCurrentDetailRequest = (token: number) => token === detailRequests
  /* Nothing on the wire is this detail's answer any more - called where the user leaves it behind
   * altogether, because a request coming back after that moved the address from wherever they went. */
  const abandonDetailRequests = () => detailRequests++

  /* A read to run once the read of the detail that is current now has landed, with the counter it was current at.
   * Its answer may be from before something that changed the asset meanwhile (a bulk save); an answer of a newer
   * read is not, and drops it. */
  let afterCurrentRead: { request: number; read: () => void } | null = null
  /** Runs `read` now when nothing is on its way, or once the read current now has landed. */
  function readAfterCurrentRead(read: () => void) {
    if (!loader.value) {
      read()
      return
    }
    // One waiting for an older read is dropped: that read is no longer current, and its answer will not be written.
    const before = afterCurrentRead?.request === detailRequests ? afterCurrentRead.read : undefined
    afterCurrentRead = {
      request: detailRequests,
      read: () => {
        before?.()
        read()
      },
    }
  }

  /* The question asked before metadata that were not saved are thrown away by leaving the asset, and what waits for
   * its answer. */
  const leaveUnsavedQuestion = ref(false)
  let leaveUnsavedAnswer: ((leave: boolean) => void) | null = null
  /** Not under the loader: the form is not shown then, and the asset it was of has been left already. */
  const showsUnsavedMetadata = computed(() => detail.value && !loader.value && metadataAreTouched.value)
  /** The same with the detail closed: the panel beside the list is the form then, whether it is in view or not. */
  const panelHoldsUnsavedMetadata = computed(() => !detail.value && !loader.value && metadataAreTouched.value)

  /** Asks whether to leave the metadata that were not saved; one question at a time, another ask meanwhile stays. */
  function askToLeaveUnsaved() {
    if (leaveUnsavedQuestion.value) return Promise.resolve(false)
    leaveUnsavedQuestion.value = true

    return new Promise<boolean>((resolve) => (leaveUnsavedAnswer = resolve))
  }

  function answerLeaveUnsaved(leave: boolean) {
    leaveUnsavedQuestion.value = false
    const answer = leaveUnsavedAnswer
    leaveUnsavedAnswer = null
    answer?.(leave)
  }

  function updateLastFetched(id: DocId) {
    lastFetchedId.value = id
    lastFetched.value = Date.now()
  }

  function showDetail() {
    detail.value = true
  }

  function hideDetail() {
    // Only the dialog: the requests stay, because the panel on the right reads this same store.
    detail.value = false
    // The question was about a step of the dialog: it goes with it, not on to the page of the list.
    answerLeaveUnsaved(false)
  }

  function showLoader() {
    loader.value = true
    // A read of the detail begins: the form an open question is about goes behind the loader, and is replaced.
    answerLeaveUnsaved(false)
  }

  function hideLoader() {
    loader.value = false
    // Every read of the detail that is current when it ends comes here.
    const pending = afterCurrentRead
    afterCurrentRead = null
    if (pending?.request === detailRequests) pending.read()
  }

  /** The shortcut that skips a read of the asset fetched last is not taken for one of these: it is not as it was. */
  function forgetLastFetched(assetIds: DocId[]) {
    if (!assetIds.includes(lastFetchedId.value)) return
    lastFetchedId.value = ''
    lastFetched.value = 0
  }

  function setAsset(newAsset: AssetDetailItemDto) {
    const { getAuthorConflicts } = useAssetSuggestions()
    mainFileSingleUse.value = newAsset?.mainFileSingleUse || false
    mainFileOverrideInternal.value = newAsset?.mainFile?.flags.overrideInternal || false
    mainFileInternal.value = newAsset?.mainFile?.flags.internal || false
    ttsAudio.value = newAsset?.assetFileProperties?.ttsAudio || false
    metadataAreTouched.value = false // todo check
    // What was typed is replaced: an open question has nothing left to keep.
    answerLeaveUnsaved(false)
    authorConflicts.value = getAuthorConflicts(newAsset.metadata.authorSuggestions)
    prefetchLazyData(newAsset) // todo check
    asset.value = newAsset
  }

  function prefetchLazyData(assetData: AssetDetailItemDto) {
    const { fetchCachedAuthors, addToCachedAuthors } = useCachedAuthors()
    const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

    addToCachedKeywords(assetData.keywords)
    addToCachedAuthors(assetData.authors)
    addToCachedAuthors(authorConflicts.value)
    fetchCachedKeywords()
    fetchCachedAuthors()
  }

  function setView(value: 'list' | 'queue') {
    view.value = value
  }

  function setDistributionCategory(value: DocIdNullable) {
    if (asset.value) {
      asset.value.distributionCategory = value
    }
  }

  function setDeleting() {
    if (!asset.value) return
    asset.value.attributes.assetStatus = DamAssetStatus.Deleting
    // What was typed into it has nowhere to be saved: it is not asked about, and no "Save" stands out for it.
    metadataAreTouched.value = false
  }

  function reset() {
    abandonDetailRequests()
    /* The cache keys off these two, so leaving them behind meant a click within five seconds of a
     * reset short-circuited to a detail that is no longer loaded - a fullscreen dialog with no
     * content and no way out: the dialogs are persistent, Esc does not close one. */
    lastFetchedId.value = ''
    lastFetched.value = 0
    asset.value = null
    authorConflicts.value = []
    loader.value = false
    detail.value = false
    view.value = 'list'
    metadataAreTouched.value = false
    mainFileSingleUse.value = false
    mainFileOverrideInternal.value = false
    mainFileInternal.value = false
    ttsAudio.value = false
    answerLeaveUnsaved(false)
  }

  return {
    asset,
    authorConflicts,
    loader,
    siblingLoader,
    detail,
    view,
    metadataAreTouched,
    directDetailLoad,
    lastFetched,
    lastFetchedId,
    mainFileSingleUse,
    mainFileOverrideInternal,
    mainFileInternal,
    ttsAudio,
    leaveUnsavedQuestion,
    showsUnsavedMetadata,
    panelHoldsUnsavedMetadata,
    askToLeaveUnsaved,
    answerLeaveUnsaved,
    startDetailRequest,
    isCurrentDetailRequest,
    abandonDetailRequests,
    readAfterCurrentRead,
    forgetLastFetched,
    updateLastFetched,
    showDetail,
    hideDetail,
    showLoader,
    hideLoader,
    setAsset,
    prefetchLazyData,
    setView,
    setDistributionCategory,
    setDeleting,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetDetailStore, import.meta.hot))
}
