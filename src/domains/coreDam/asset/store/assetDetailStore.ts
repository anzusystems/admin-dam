import { AssetFileProcessStatus, DamAssetStatus, useAssetSuggestions } from '@anzusystems/common-admin'
import type {
  AssetDetailItemDto,
  AssetFile,
  AssetFileProcessStatusType,
  DocId,
  DocIdNullable,
} from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'
import { metadataSaveSent } from '@/domains/coreDam/shared/services/upload/queueRowBaseline'

// When the server last changed the file image (a rotation does). Empty for other file types.
const manipulatedAt = (file: AssetFile) => ('manipulatedAt' in file ? (file.manipulatedAt ?? '') : '')

const FILE_ENDED: AssetFileProcessStatusType[] = [
  AssetFileProcessStatus.Processed,
  AssetFileProcessStatus.Failed,
  AssetFileProcessStatus.Duplicate,
]

export const useAssetDetailStore = defineStore('damAssetDetailStore', () => {
  const asset = ref<AssetDetailItemDto | null>(null)
  const authorConflicts = ref<DocId[]>([])
  const loader = ref(false)
  const siblingLoader = ref(false)
  const detail = ref(false)
  const view = ref<'list' | 'queue'>('list')
  const metadataAreTouched = ref(false)
  const lastFetched = ref(Date.now())
  const lastFetchedId = ref<DocId>('')
  const mainFileSingleUse = ref(false)
  const mainFileOverrideInternal = ref(false)
  const mainFileInternal = ref(false)
  const ttsAudio = ref(false)
  /*
   * "Save" is held back while the server may still fill metadata
   * from the main file, and the form is as old as the asset read.
   * Once another main file was set under typed input, its status says nothing
   * about the form, so "Save" stays held until the whole asset is read.
   */
  const saveHeldBack = ref(false)

  /*
   * Clicks, held arrow keys, the queue edit button and the deep-link view start
   * several detail fetches that return out of order. Only the newest may write here.
   * It always reaches its `finally` and lowers the loader. After `abandonDetailRequests`
   * none is newest, and the loader waits for the reset each component does on mount.
   */
  let detailRequests = 0
  // The asset the newest request reads, when known.
  let detailRequestOf: DocId | null = null
  /** @param assetId The asset read into the detail, when known. */
  const startDetailRequest = (assetId: DocId | null = null) => {
    detailRequestOf = assetId
    return ++detailRequests
  }
  const isCurrentDetailRequest = (token: number) => token === detailRequests
  /*
   * Marks every request in flight as stale. Called when the user leaves the detail,
   * because a late answer used to move the address away from where they went.
   */
  const abandonDetailRequests = () => detailRequests++

  /*
   * A read to run after the current detail read lands, with the counter value it was current at.
   * The current answer may predate a change such as a bulk save. A newer read's answer does not, so it drops this one.
   */
  let afterCurrentRead: { request: number; read: () => void } | null = null
  /** Runs `read` now when nothing is in flight, otherwise after the current read lands. */
  function readAfterCurrentRead(read: () => void) {
    if (!loader.value) {
      read()
      return
    }
    // A callback waiting for an older read is dropped: that read is stale and its answer will not be written.
    const before = afterCurrentRead?.request === detailRequests ? afterCurrentRead.read : undefined
    afterCurrentRead = {
      request: detailRequests,
      read: () => {
        before?.()
        read()
      },
    }
  }

  /*
   * Form saves per asset (detail and panel): how many were sent and how many are in flight.
   * A read sent before a save can return the pre-save asset, and a form built from it would overwrite the save.
   */
  const saves = new Map<DocId, { sent: number; onTheirWay: number }>()

  /*
   * Typed input is counted. A save with new input since the previous save takes the
   * next count. A save that only repeats input of one in flight shares its count.
   * Tracks saves in flight per form and the last saved count. Until a count's
   * save is answered, its input counts as unsaved for the leave confirmation.
   */
  let typedCounts = 0
  const typedSaves = shallowRef<Array<{ form: object; typed: number }>>([])
  const savedTyped = new WeakMap<object, number>()
  /** Whether typed input is not yet confirmed saved because its save is in flight. */
  const typedOnItsWay = (form: object) =>
    typedSaves.value.some((save) => save.form === form && save.typed > (savedTyped.get(form) ?? 0))

  /**
   * Call when a form save is sent from the detail or the panel. Typed input,
   * including what a save of the same form in flight took, is no longer "touched".
   * Returns a callback for when the save is answered, with `failed`.
   * On failure the input becomes unsaved again, unless another save saved it or one in flight
   * also takes it. Only while the form is unchanged and the asset is not being deleted.
   */
  function saveSent(form: AssetDetailItemDto) {
    const of = saves.get(form.id) ?? { sent: 0, onTheirWay: 0 }
    saves.set(form.id, of)
    of.sent++
    of.onTheirWay++
    // Also tracked for reads of the asset's queue rows.
    const answered = metadataSaveSent([form.id])
    const before = typedSaves.value.filter((save) => save.form === form).map((save) => save.typed)
    const typed = metadataAreTouched.value ? ++typedCounts : Math.max(0, ...before)
    metadataAreTouched.value = false
    const save = { form, typed }
    if (typed) typedSaves.value = [...typedSaves.value, save]

    return (failed: boolean) => {
      of.onTheirWay--
      answered()
      if (!typed) return
      if (!failed) savedTyped.set(form, Math.max(savedTyped.get(form) ?? 0, typed))
      typedSaves.value = typedSaves.value.filter((other) => other !== save)
      const saved = typed <= (savedTyped.get(form) ?? 0)
      const takenFurther = typedSaves.value.some((other) => other.form === form && other.typed >= typed)
      if (failed && !saved && !takenFurther && asset.value === form && !isDeleting.value) {
        metadataAreTouched.value = true
      }
    }
  }

  /**
   * Number of form saves sent for the asset, or null while one
   * is in flight. Equal values twice mean no save in between.
   */
  function savesOf(assetId: DocId) {
    const of = saves.get(assetId)

    return of?.onTheirWay ? null : (of?.sent ?? 0)
  }

  /** The held asset is being deleted, here or elsewhere per the server. Nothing of it may be changed. */
  const isDeleting = computed(() => asset.value?.attributes?.assetStatus === DamAssetStatus.Deleting)

  /*
   * Unsaved input in the held form, including while its save is in flight, since that save can fail.
   * Not for an asset being deleted: there is nowhere to save it.
   */
  const holdsUnsavedMetadata = computed(
    () => metadataAreTouched.value || (!!asset.value && !isDeleting.value && typedOnItsWay(asset.value))
  )

  /* The leave-unsaved-metadata confirmation and the resolver waiting for its answer. */
  const leaveUnsavedQuestion = ref(false)
  let leaveUnsavedAnswer: ((leave: boolean) => void) | null = null
  /*
   * "Leave anyway" gives up the input. The read it was asked for continues behind the
   * loader and replaces it. Holds until a loader is lowered or the form is replaced.
   */
  const typedLeft = ref(false)
  /*
   * The asset whose input "Leave anyway" released for a mass edit save in flight. Its
   * form blocks typing until the post-save read starts (`loader`), which replaces it.
   */
  const leftForMassSave = ref<DocId | null>(null)
  /** Not under the loader: the form is hidden then and its asset already left. */
  const showsUnsavedMetadata = computed(() => detail.value && !loader.value && holdsUnsavedMetadata.value)
  /**
   * Same with the detail closed: the panel is the form then, visible
   * or not. Also under a loader, unless the input was given up.
   */
  const panelHoldsUnsavedMetadata = computed(
    () => !detail.value && holdsUnsavedMetadata.value && !(loader.value && typedLeft.value)
  )

  /** Asks whether to drop unsaved metadata. One question at a time: a concurrent ask resolves to stay. */
  function askToLeaveUnsaved() {
    if (leaveUnsavedQuestion.value) return Promise.resolve(false)
    leaveUnsavedQuestion.value = true

    return new Promise<boolean>((resolve) => (leaveUnsavedAnswer = resolve))
  }

  function answerLeaveUnsaved(leave: boolean) {
    if (leaveUnsavedQuestion.value) typedLeft.value = leave
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
    // Close only the dialog. Keep the requests, because the right-side panel reads this same store.
    detail.value = false
    // The open question belongs to a dialog step. It closes with the dialog and does not carry over to the list page.
    answerLeaveUnsaved(false)
  }

  function showLoader() {
    loader.value = true
    // A detail read starts. The form the open question is about goes behind the loader and gets replaced.
    answerLeaveUnsaved(false)
  }

  function hideLoader() {
    loader.value = false
    typedLeft.value = false
    // Every detail read that is still current when it ends reaches this point.
    const pending = afterCurrentRead
    afterCurrentRead = null
    if (pending?.request === detailRequests) pending.read()
  }

  /**
   * These assets changed since the last fetch, so the shortcut that
   * skips re-reading the last fetched asset must not apply to them.
   */
  function forgetLastFetched(assetIds: DocId[]) {
    if (!assetIds.includes(lastFetchedId.value)) return
    lastFetchedId.value = ''
    lastFetched.value = 0
  }

  /** The three form switches that belong to the main file. Off for an asset without one. */
  function readMainFileSwitches(read: AssetDetailItemDto) {
    mainFileSingleUse.value = read?.mainFileSingleUse || false
    mainFileOverrideInternal.value = read?.mainFile?.flags.overrideInternal || false
    mainFileInternal.value = read?.mainFile?.flags.internal || false
  }

  /*
   * For an asset marked as deleting (`setDeleting`), ignore reads that may have been sent before the delete.
   * They would restore the old asset and a form that saves into a deleted asset.
   * A detail read started after the mark (`request`) is accepted: it shows the current server state.
   */
  const heldAsDeleting = (assetId: DocId) =>
    asset.value?.id === assetId && asset.value.attributes.assetStatus === DamAssetStatus.Deleting
  // Newest detail request at the time the held asset was marked as deleting.
  let markedDeletingAt = 0

  /** `request`: the detail request that read the asset, if any. */
  function setAsset(newAsset: AssetDetailItemDto, request?: number) {
    if (heldAsDeleting(newAsset.id) && !(request && request > markedDeletingAt)) return
    const { getAuthorConflicts } = useAssetSuggestions()
    readMainFileSwitches(newAsset)
    ttsAudio.value = newAsset?.assetFileProperties?.ttsAudio || false
    metadataAreTouched.value = false // todo check
    saveHeldBack.value = false
    typedLeft.value = false
    // The typed values are replaced, so the open question has nothing left to keep.
    answerLeaveUnsaved(false)
    authorConflicts.value = getAuthorConflicts(newAsset.metadata.authorSuggestions)
    prefetchLazyData(newAsset) // todo check
    toldOfMainFile = null
    asset.value = newAsset
  }

  /*
   * "Save" is held back until the whole asset is read.
   * The recent-fetch shortcut would skip that read. A read stamped
   * after the file news but before the hold does not count.
   */
  function holdSaveBack(assetId: DocId) {
    saveHeldBack.value = true
    forgetLastFetched([assetId])
  }

  /*
   * Keep the typed form values. Take only the main file from the server
   * `read`: its current route and processing state, a different file, or none.
   * With a different file, also take its three switches. "Save" sends them
   * for the current main file, so the old file's switches would overwrite it.
   * An unsaved switch change stays while its file is still the main one. `saveWasHeldBack`
   * keeps it also after the file becomes processed, because the form is still the earlier one.
   * Also take the asset state, which depends on its files: draft until a file is processed, and again once it has none.
   */
  function setMainFile(read: AssetDetailItemDto, saveWasHeldBack: boolean) {
    if (!asset.value || heldAsDeleting(asset.value.id)) return
    if (saveWasHeldBack) holdSaveBack(asset.value.id)
    const anotherFile = asset.value.mainFile?.id !== read.mainFile?.id
    toldOfMainFile = null
    asset.value.mainFile = read.mainFile
    asset.value.attributes.assetStatus = read.attributes.assetStatus
    if (anotherFile) readMainFileSwitches(read)
  }

  /*
   * Apply the server's rotation answer to the main file only, and only while it is still the
   * held asset's main file. Typed values and switches are not touched, unlike `setAsset`.
   * Skip a file older than the held one: an asset read answered after the rotation keeps a later change.
   */
  function setMainFileRotated(file: AssetFile) {
    const held = asset.value?.mainFile
    if (!asset.value || held?.id !== file.id) return
    if (manipulatedAt(file) < manipulatedAt(held)) return
    asset.value.mainFile = file
  }

  /*
   * The detail page re-reads its asset when a part of the detail changes the file.
   * File processing progress comes from notifications and upload queue reads, outside any page. They report it here.
   * The page registers how it is notified: a read nobody in the detail started, with no loader.
   */
  let tellPage: (() => void) | null = null

  /*
   * Files in other slots of the held asset that the page was already told about.
   * Both the notification and the queue read report each as processed, in
   * any order. One asset read per file is enough. Reset for another asset.
   */
  let toldOfOtherFiles: { assetId: DocId; fileIds: Set<DocId> } = { assetId: '', fileIds: new Set() }
  /*
   * The main file the page was told about last, with its final status.
   * The queue row and the notification report it one after the other,
   * before the first read lands. Cleared once an asset read lands or fails.
   */
  let toldOfMainFile: { assetId: DocId; fileId: DocId; status: AssetFileProcessStatusType } | null = null

  /** `fileChanged` makes the page re-read its asset. Returns an unregister function for when the page goes away. */
  function tellPageBy(fileChanged: () => void) {
    tellPage = fileChanged

    return () => {
      if (tellPage === fileChanged) tellPage = null
    }
  }

  /** The page's read after a notification failed. Clear it so the next notification reads again. */
  function readOfToldFailed() {
    toldOfMainFile = null
  }

  /** The page that draws the detail now is told the file of its asset has changed, as the server tells it. */
  function tellPageOfFileChange() {
    tellPage?.()
  }

  /** The asset shown by the detail. Under the loader it is the one being read. Null when unknown. */
  const shownOrReadAssetId = () => (loader.value ? detailRequestOf : (asset.value?.id ?? null))

  /**
   * Server report of a file's state: processed, failed, duplicate,
   * or (from the upload queue read) the main file still processing.
   * A detail or panel opened earlier holds the old main file, with
   * "Save" held back for a non-described asset, and would keep it.
   * An asset created empty has no main file. The first file put into a slot becomes the main one.
   * The page re-reads without loader when the held asset has no main file, has this file as main in another state, or
   * (non-described) has it processed in another slot. Now, or after a pending read lands with the asset unchanged.
   */
  function fileStatusOnServer(assetId: DocId, fileId: DocId, status: AssetFileProcessStatusType) {
    const ended = FILE_ENDED.includes(status)
    /*
     * The server fills a non-described asset's metadata from the first
     * file it processes, in any slot, even one that later fails.
     * The metadata are saved before processing ends. So the form is stale until the whole asset is read.
     */
    const mayHaveFilledIn = () =>
      (status === AssetFileProcessStatus.Processed || status === AssetFileProcessStatus.Failed) &&
      asset.value?.mainFile?.id !== fileId &&
      !asset.value?.flags?.described
    const heldAsBefore = () => {
      if (asset.value?.id !== assetId) return false
      const file = asset.value.mainFile
      if (!file) return true
      if (file.id === fileId) return ended && file.fileAttributes.status !== status

      return mayHaveFilledIn()
    }
    // The asset changed since the fetch, so it must be re-read even within the recent-fetch window.
    if (heldAsBefore()) forgetLastFetched([assetId])
    readAfterCurrentRead(() => {
      if (!heldAsBefore() || !tellPage) return
      if (mayHaveFilledIn()) {
        if (toldOfOtherFiles.assetId !== assetId) toldOfOtherFiles = { assetId, fileIds: new Set() }
        if (toldOfOtherFiles.fileIds.has(fileId)) return
        toldOfOtherFiles.fileIds.add(fileId)
        // Read whole when nothing is typed, which releases the hold. Otherwise keep the typed values.
        holdSaveBack(assetId)
      } else {
        const told = toldOfMainFile
        if (told?.assetId === assetId && told.fileId === fileId && told.status === status) return
        toldOfMainFile = { assetId, fileId, status }
      }
      tellPage()
    })
  }

  /**
   * The metadata save went through and the server marks these assets described. It no longer fills them from a file.
   * Mark the held asset too if it is one of them. The form and typed values stay unchanged.
   */
  function savedAsDescribed(assetIds: DocId[]) {
    if (!asset.value?.flags || !assetIds.includes(asset.value.id)) return
    asset.value.flags.described = true
  }

  /**
   * Reads made outside the detail (list, mass-edit batch) bring each asset's main file as the server has it.
   * For an ended main file this is the same news as the notification and is handled the same way.
   */
  function mainFileOfRead(read: Pick<AssetDetailItemDto, 'id' | 'mainFile'>) {
    const file = read.mainFile
    if (!file?.fileAttributes || !FILE_ENDED.includes(file.fileAttributes.status)) return
    fileStatusOnServer(read.id, file.id, file.fileAttributes.status)
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
    markedDeletingAt = detailRequests
    // Typed values have nowhere to be saved, so do not ask about them and do not highlight "Save".
    metadataAreTouched.value = false
  }

  function reset() {
    abandonDetailRequests()
    /*
     * The cache keys off these two. If left set, a click within five seconds of a reset showed an unloaded detail.
     * That was a fullscreen dialog with no content and no way out:
     * the dialogs are persistent and Esc does not close them.
     */
    lastFetchedId.value = ''
    lastFetched.value = 0
    toldOfMainFile = null
    leftForMassSave.value = null
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
    typedLeft.value = false
  }

  return {
    asset,
    authorConflicts,
    loader,
    siblingLoader,
    detail,
    view,
    metadataAreTouched,
    lastFetched,
    lastFetchedId,
    mainFileSingleUse,
    mainFileOverrideInternal,
    mainFileInternal,
    ttsAudio,
    saveHeldBack,
    isDeleting,
    saveSent,
    savesOf,
    holdsUnsavedMetadata,
    leaveUnsavedQuestion,
    typedLeft,
    leftForMassSave,
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
    setMainFileRotated,
    tellPageBy,
    tellPageOfFileChange,
    readOfToldFailed,
    shownOrReadAssetId,
    fileStatusOnServer,
    mainFileOfRead,
    savedAsDescribed,
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
