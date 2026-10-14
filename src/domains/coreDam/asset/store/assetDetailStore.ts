import { AssetFileProcessStatus, DamAssetStatus, useAssetSuggestions } from '@anzusystems/common-admin'
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
  /* "Save" is held back while the server may still fill in the metadata of the asset from its main file, and the
   * form is as old as the read of the asset. Once another main file was taken under what was typed, the status of
   * that file says nothing of the form: held back then, "Save" stays so until the asset is read whole. */
  const saveHeldBack = ref(false)

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

  /* The saves of the form of an asset - in the detail, in the panel beside the list - by the asset: how many went out,
   * and how many are on their way. A read of the asset sent before a save can be answered as the asset was before it,
   * and a form taken from that answer would be saved back over it. */
  const saves = new Map<DocId, { sent: number; onTheirWay: number }>()

  /** As a save of the form of the asset goes out: answers what is called once it is answered, however it ends. */
  function saveSent(assetId: DocId) {
    const of = saves.get(assetId) ?? { sent: 0, onTheirWay: 0 }
    saves.set(assetId, of)
    of.sent++
    of.onTheirWay++

    return () => {
      of.onTheirWay--
    }
  }

  /** How many saves of the form of the asset went out, or null while one is on its way: the same twice, none between. */
  function savesOf(assetId: DocId) {
    const of = saves.get(assetId)

    return of?.onTheirWay ? null : (of?.sent ?? 0)
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

  /** The three switches of the form that are the main file's own: off for an asset that has none. */
  function readMainFileSwitches(read: AssetDetailItemDto) {
    mainFileSingleUse.value = read?.mainFileSingleUse || false
    mainFileOverrideInternal.value = read?.mainFile?.flags.overrideInternal || false
    mainFileInternal.value = read?.mainFile?.flags.internal || false
  }

  function setAsset(newAsset: AssetDetailItemDto) {
    const { getAuthorConflicts } = useAssetSuggestions()
    readMainFileSwitches(newAsset)
    ttsAudio.value = newAsset?.assetFileProperties?.ttsAudio || false
    metadataAreTouched.value = false // todo check
    saveHeldBack.value = false
    // What was typed is replaced: an open question has nothing left to keep.
    answerLeaveUnsaved(false)
    authorConflicts.value = getAuthorConflicts(newAsset.metadata.authorSuggestions)
    prefetchLazyData(newAsset) // todo check
    asset.value = newAsset
  }

  /* What was typed into the form stays, and of what the server has (`read`) the main file is taken: as it is by
   * now - its route, how far it is processed - or another one than the form was read with, or none any more. With
   * another file its three switches are taken too: "Save" sends them for the main file the asset has by then, and
   * those of the file before it would be written over this one's. A switch flipped and not saved goes with the file
   * it was flipped for, and stays while that file is the main one. `saveWasHeldBack`: so it stays, also once the
   * file is held as processed - the form is still the one read before that. */
  function setMainFile(read: AssetDetailItemDto, saveWasHeldBack: boolean) {
    if (!asset.value) return
    if (saveWasHeldBack) saveHeldBack.value = true
    const anotherFile = asset.value.mainFile?.id !== read.mainFile?.id
    asset.value.mainFile = read.mainFile
    if (anotherFile) readMainFileSwitches(read)
  }

  /* The page that draws the detail reads its asset again once the file of the asset has changed, told by the part of
   * the detail that changed it. That the server has processed a file no part of a detail tells: its notification
   * and the reads of the upload queue say so, outside of every page. They say it here, and the page that is there
   * says by what it is to be told: a read nobody in the detail started, with no loader over it. */
  let tellPage: (() => void) | null = null

  /** `fileChanged` is what the page reads its asset again by. Answers what takes it back, for when the page goes. */
  function tellPageBy(fileChanged: () => void) {
    tellPage = fileChanged

    return () => {
      if (tellPage === fileChanged) tellPage = null
    }
  }

  /**
   * The server has processed a file. A detail or a panel opened before that holds the file as still on its way - by
   * which "Save" of an asset that is not described is held back - and would go on holding it so. When the file is
   * the main one of the asset held here, held as not processed, the page is told, and reads the asset with no loader:
   * at once, or once a read that is on its way has landed with the file still not processed.
   */
  function mainFileProcessed(assetId: DocId, fileId: DocId) {
    const heldAsNotProcessed = () => {
      const file = asset.value?.id === assetId ? asset.value.mainFile : null

      return !!file && file.id === fileId && file.fileAttributes.status !== AssetFileProcessStatus.Processed
    }
    // Not as it was fetched: come back to within the moment in which an asset just read is not read again, it is.
    if (heldAsNotProcessed()) forgetLastFetched([assetId])
    readAfterCurrentRead(() => {
      if (heldAsNotProcessed()) tellPage?.()
    })
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
    saveHeldBack.value = false
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
    saveHeldBack,
    saveSent,
    savesOf,
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
    setMainFile,
    tellPageBy,
    mainFileProcessed,
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
