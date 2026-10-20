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

// When the server last changed the image of a file (a rotation does); none for a file of another type.
const manipulatedAt = (file: AssetFile) => ('manipulatedAt' in file ? (file.manipulatedAt ?? '') : '')

// The states the server ends the processing of a file in.
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
  /* "Save" is held back while the server may still fill in the metadata of the asset from its main file, and the
   * form is as old as the read of the asset. Once another main file was taken under what was typed, the status of
   * that file says nothing of the form: held back then, "Save" stays so until the asset is read whole. */
  const saveHeldBack = ref(false)

  /* Clicks, held-down arrow keys, the queue's edit button and the deep-link view put several detail
   * fetches on the wire at once and they do not come back in order; only the newest may write here.
   * It always reaches its own `finally` and lowers the loader - after `abandonDetailRequests` none
   * is newest, and the loader waits for the reset every component does on mount. */
  let detailRequests = 0
  // The asset the newest of them reads, when it is known.
  let detailRequestOf: DocId | null = null
  /** `assetId`: the asset it reads into the detail, where that is known. */
  const startDetailRequest = (assetId: DocId | null = null) => {
    detailRequestOf = assetId
    return ++detailRequests
  }
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

  /* What was typed into a form, counted: each save that takes something typed since the save before it takes the next
   * count, and a save that only takes over what one on its way took has that one's count. The saves of a form on their
   * way with what they took, and the count saved last of each form: until a save of a count is answered, what was typed
   * up to it is not saved yet, and leaving the form is asked about as it was before the save went out. */
  let typedCounts = 0
  const typedSaves = shallowRef<Array<{ form: object; typed: number }>>([])
  const savedTyped = new WeakMap<object, number>()
  /** Whether something typed into the form is not known as saved, a save of it on its way. */
  const typedOnItsWay = (form: object) =>
    typedSaves.value.some((save) => save.form === form && save.typed > (savedTyped.get(form) ?? 0))

  /**
   * As a save of the form of the asset goes out, from the detail or from the panel beside the list. What was typed into
   * the form goes with it and is no longer "touched", and so does what a save of the same form still on its way took.
   * Answers what is called once the save is answered, `failed` or not. A failure brings back as unsaved what this save
   * took, unless another save of the form saved it, or one still on its way takes it as well - its end counts then -,
   * while the form is still the one it was taken from and the asset is not being deleted: what was typed into it has
   * nowhere to be saved.
   */
  function saveSent(form: AssetDetailItemDto) {
    const of = saves.get(form.id) ?? { sent: 0, onTheirWay: 0 }
    saves.set(form.id, of)
    of.sent++
    of.onTheirWay++
    // Known to a read of a queue row of the asset too.
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

  /** How many saves of the form of the asset went out, or null while one is on its way: the same twice, none between. */
  function savesOf(assetId: DocId) {
    const of = saves.get(assetId)

    return of?.onTheirWay ? null : (of?.sent ?? 0)
  }

  /** The asset held is being deleted - here, elsewhere, by the word of the server: nothing of it is to be changed. */
  const isDeleting = computed(() => asset.value?.attributes?.assetStatus === DamAssetStatus.Deleting)

  /* Typed into the form held and not saved: also while a save of it is on its way, which can fail and leave it unsaved.
   * Nothing of an asset being deleted: it has nowhere to be saved. */
  const holdsUnsavedMetadata = computed(
    () => metadataAreTouched.value || (!!asset.value && !isDeleting.value && typedOnItsWay(asset.value))
  )

  /* The question asked before metadata that were not saved are thrown away by leaving the asset, and what waits for
   * its answer. */
  const leaveUnsavedQuestion = ref(false)
  let leaveUnsavedAnswer: ((leave: boolean) => void) | null = null
  /* "Leave anyway" gives what was typed up: the read the question was asked for goes on behind the loader, and replaces
   * it. Until a loader is lowered, or the form is replaced. */
  const typedLeft = ref(false)
  /** Not under the loader: the form is not shown then, and the asset it was of has been left already. */
  const showsUnsavedMetadata = computed(() => detail.value && !loader.value && holdsUnsavedMetadata.value)
  /** The same with the detail closed: the panel beside the list is the form then, whether it is in view or not, and
   * also behind a loader that is not over what was given up. */
  const panelHoldsUnsavedMetadata = computed(
    () => !detail.value && holdsUnsavedMetadata.value && !(loader.value && typedLeft.value)
  )

  /** Asks whether to leave the metadata that were not saved; one question at a time, another ask meanwhile stays. */
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
    typedLeft.value = false
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

  /* An asset marked as being deleted (`setDeleting`): a read of it answered after that can have been asked before the
   * delete went through, and would put back the asset as it was, with a form to save into an asset that is going. Not
   * a read of the detail started after it was marked (`request`): the server says how the asset is now. */
  const heldAsDeleting = (assetId: DocId) =>
    asset.value?.id === assetId && asset.value.attributes.assetStatus === DamAssetStatus.Deleting
  // The detail request that was the newest one when the asset held was marked as being deleted.
  let markedDeletingAt = 0

  /** `request`: the detail request that read it, for one that does. */
  function setAsset(newAsset: AssetDetailItemDto, request?: number) {
    if (heldAsDeleting(newAsset.id) && !(request && request > markedDeletingAt)) return
    const { getAuthorConflicts } = useAssetSuggestions()
    readMainFileSwitches(newAsset)
    ttsAudio.value = newAsset?.assetFileProperties?.ttsAudio || false
    metadataAreTouched.value = false // todo check
    saveHeldBack.value = false
    typedLeft.value = false
    // What was typed is replaced: an open question has nothing left to keep.
    answerLeaveUnsaved(false)
    authorConflicts.value = getAuthorConflicts(newAsset.metadata.authorSuggestions)
    prefetchLazyData(newAsset) // todo check
    toldOfMainFile = null
    asset.value = newAsset
  }

  /* "Save" held back until the asset is read whole. The shortcut that skips a read of the asset fetched a moment ago
   * would skip that read too: a read stamped after the news of the file, before the hold, is not one. */
  function holdSaveBack(assetId: DocId) {
    saveHeldBack.value = true
    forgetLastFetched([assetId])
  }

  /* What was typed into the form stays, and of what the server has (`read`) the main file is taken: as it is by
   * now - its route, how far it is processed - or another one than the form was read with, or none any more. With
   * another file its three switches are taken too: "Save" sends them for the main file the asset has by then, and
   * those of the file before it would be written over this one's. A switch flipped and not saved goes with the file
   * it was flipped for, and stays while that file is the main one. `saveWasHeldBack`: so it stays, also once the
   * file is held as processed - the form is still the one read before that. And the state of the asset, which comes
   * with its files and is no field of the form: a draft until a file of it is processed, again once it has none. */
  function setMainFile(read: AssetDetailItemDto, saveWasHeldBack: boolean) {
    if (!asset.value || heldAsDeleting(asset.value.id)) return
    if (saveWasHeldBack) holdSaveBack(asset.value.id)
    const anotherFile = asset.value.mainFile?.id !== read.mainFile?.id
    toldOfMainFile = null
    asset.value.mainFile = read.mainFile
    asset.value.attributes.assetStatus = read.attributes.assetStatus
    if (anotherFile) readMainFileSwitches(read)
  }

  /* The main file as the server answered its rotation: only the file, and only while it is the main file of the asset
   * held - nothing typed or switched is touched, as `setAsset` would. Not a file the server changed before the one
   * held: a read of the asset answered after the rotation keeps a later change. */
  function setMainFileRotated(file: AssetFile) {
    const held = asset.value?.mainFile
    if (!asset.value || held?.id !== file.id) return
    if (manipulatedAt(file) < manipulatedAt(held)) return
    asset.value.mainFile = file
  }

  /* The page that draws the detail reads its asset again once the file of the asset has changed, told by the part of
   * the detail that changed it. How far the server is with a file no part of a detail tells: its notifications and
   * the reads of the upload queue say so, outside of every page. They say it here, and the page that is there says by
   * what it is to be told: a read nobody in the detail started, with no loader over it. */
  let tellPage: (() => void) | null = null

  /* The files of other slots of the asset held here that the page was told of: the notification of each and the read of
   * the queue that settles its row both say it is processed, in whatever order, and one read of the asset is enough
   * for each file. Begun anew for another asset. */
  let toldOfOtherFiles: { assetId: DocId; fileIds: Set<DocId> } = { assetId: '', fileIds: new Set() }
  /* And the main file it was told of last, with how the server ended it: the row of the queue the notification settles
   * and the notification itself say it one after the other, before the read of the first has landed. Forgotten once a
   * read of the asset lands, or fails. */
  let toldOfMainFile: { assetId: DocId; fileId: DocId; status: AssetFileProcessStatusType } | null = null

  /** `fileChanged` is what the page reads its asset again by. Answers what takes it back, for when the page goes. */
  function tellPageBy(fileChanged: () => void) {
    tellPage = fileChanged

    return () => {
      if (tellPage === fileChanged) tellPage = null
    }
  }

  /** A read the page started for what it was told failed: told again, it reads again. */
  function readOfToldFailed() {
    toldOfMainFile = null
  }

  /** The page that draws the detail now is told the file of its asset has changed, as the server tells it. */
  function tellPageOfFileChange() {
    tellPage?.()
  }

  /** The asset the detail shows - under its loader the one being read into it, null when that is not known. */
  const shownOrReadAssetId = () => (loader.value ? detailRequestOf : (asset.value?.id ?? null))

  /**
   * The server says how far it is with a file of an asset: that it has processed it, or ended it failed or as a
   * duplicate, or - as the upload queue reads the asset - that the file is the main one and still on its way. A
   * detail or a panel opened before that holds the main file as it was then - "Save" of an asset that is not
   * described held back while it is on its way - and would go on holding it so. One of an asset created empty holds
   * no main file at all, and the first file put into a slot of it becomes the main one. The page is told, and reads
   * the asset with no loader, when the asset held here has no main file, or has this file as its main one in another
   * state than the one the server ended it in, or - not described - has this file processed as another one than its
   * main one: at once, or once a read that is on its way has landed with the asset still held so.
   */
  function fileStatusOnServer(assetId: DocId, fileId: DocId, status: AssetFileProcessStatusType) {
    const ended = FILE_ENDED.includes(status)
    /* The server fills in the metadata of an asset that is not described from whichever of its files it processes
     * first, a file of another slot as well - also one that fails after that: the metadata are saved before its
     * processing ends. The form is then older than they are, whatever is held of the main file, until the asset is
     * read whole. */
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
    // Not as it was fetched: come back to within the moment in which an asset just read is not read again, it is.
    if (heldAsBefore()) forgetLastFetched([assetId])
    readAfterCurrentRead(() => {
      if (!heldAsBefore() || !tellPage) return
      if (mayHaveFilledIn()) {
        if (toldOfOtherFiles.assetId !== assetId) toldOfOtherFiles = { assetId, fileIds: new Set() }
        if (toldOfOtherFiles.fileIds.has(fileId)) return
        toldOfOtherFiles.fileIds.add(fileId)
        // Read whole when nothing is typed, which lets it free; kept with what was typed.
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
   * A save of the metadata of these assets went through, and the server marks each of them described with it: it
   * fills in nothing more of them from a file from then on. So the asset held here is marked as well, when it is one
   * of them - only that: the form and what was typed into it since stay as they are.
   */
  function savedAsDescribed(assetIds: DocId[]) {
    if (!asset.value?.flags || !assetIds.includes(asset.value.id)) return
    asset.value.flags.described = true
  }

  /**
   * A read of assets made for something else than the detail - the list, the batch of the mass edit - brings each
   * with its main file as the server has it. Of a main file the server has ended that is the same news as its
   * notification, and goes the same way: whether the detail has anything to learn from it is decided above.
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
    toldOfMainFile = null
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
