import {
  AssetFileProcessStatus,
  isNull,
  useAlerts,
  useDamCachedUsers,
  usePageNavigation,
} from '@anzusystems/common-admin'
import type { AssetDetailItemDto, AssetFileProcessStatusType, DocId } from '@anzusystems/common-admin'
import { inject, onBeforeUnmount, provide } from 'vue'
import type { InjectionKey } from 'vue'

import { fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { metadataMayStillChange } from '@/domains/coreDam/asset/store/uploadQueuesStore'

/* The page that draws a detail is told that the file of its asset has changed - the route of its main file, or which
 * of its files is the main one - by a function it provides, not by an event of the part of the detail that made the
 * change. The change is answered after a request, and by then that part can be unmounted (another tab of the detail,
 * the detail closed): what an unmounted component emits Vue drops. */
const AssetFileChangedKey: InjectionKey<() => void> = Symbol('assetFileChanged')

/**
 * For the page that draws the detail, in its setup: `fileChanged` is what the parts of the detail tell it by. And
 * what is no part of a detail, through the store of the detail, for as long as the page is there: the upload queue
 * and the notifications, of a file the server has processed - `byServer` then.
 */
export const provideAssetFileChanged = (fileChanged: (byServer?: boolean) => void) => {
  provide(AssetFileChangedKey, fileChanged)
  onBeforeUnmount(useAssetDetailStore().tellPageBy(() => fileChanged(true)))
}

/**
 * For a part of the detail that changes the file of the asset, in its setup. What it gives back is called once such a
 * change went through, with the asset the change was asked for: the page is told unless the detail holds another
 * asset by then. Behind its loader the detail is being read, and holds the asset before until that read lands - read
 * again then, that one would take the place of the asset the user went on to. So the page is told once the read has
 * landed: of another asset, there is nothing to tell; of the same one, it may have been answered as the asset was
 * before the change, and the page reads it once more. The asset is not as it was fetched either way: come back to
 * within the moment in which an asset just read is not read again - which also gives up a read that waits - it is
 * read all the same.
 */
export const useAssetFileChanged = () => {
  const tellPage = inject(AssetFileChangedKey, () => undefined)
  const assetDetailStore = useAssetDetailStore()

  return (assetId: DocId) => {
    assetDetailStore.forgetLastFetched([assetId])
    assetDetailStore.readAfterCurrentRead(() => {
      if (assetDetailStore.asset?.id === assetId) tellPage()
    })
  }
}

/* The reads below with no loader, counted: two changes close after each other start two of them, and so do a change
 * and the news of the server, and the answer of the older can come last. Only the one asked for last is taken. */
let latestQuietRead = 0

/* The states a file is ended in after its processing ran: the server may have filled in the metadata from it. A file
 * that failed too - the metadata are saved before the processing ends, and what fails after that fails the file. Not a
 * duplicate: it is found before anything of the file is saved. */
const PROCESSING_RAN: AssetFileProcessStatusType[] = [AssetFileProcessStatus.Processed, AssetFileProcessStatus.Failed]

/* Whether the form of `held`, read before `read`, can be older than the metadata the server has or is yet to have: of
 * an asset that is not described the server fills them in from a file as it processes it. So when the main file was
 * held as still on its way - unless the server has found that very file a duplicate. And when none was held and the
 * answer brings the first one with its processing run: one still on its way holds "Save" back by its state
 * meanwhile, and is told of again once the server has ended it. */
const formMayBeOlder = (held: AssetDetailItemDto, read: AssetDetailItemDto) => {
  const before = held.mainFile
  const now = read.mainFile
  if (!before) return !!now && PROCESSING_RAN.includes(now.fileAttributes.status) && !held.flags.described
  if (now?.id === before.id && now.fileAttributes.status === AssetFileProcessStatus.Duplicate) return false

  return metadataMayStillChange(held)
}

/* The asset a detail holds is read again once its file was changed there, in the dialog over the list, in the panel
 * beside the list and on the pages of a detail alike. */
export function useAssetDetailFileChange() {
  const assetDetailStore = useAssetDetailStore()
  const { onPage } = usePageNavigation()
  const { showErrorsDefault } = useAlerts()
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

  /* A read of the asset the detail holds, by its id, with no loader over the detail: it unmounts nothing - neither the
   * form with what was typed into it, nor a tab or a dialog open over the detail with what was typed there.
   * Metadata that were not saved stay as they are, in the form they were typed into, and of the answer only the main
   * file is taken - as the server has it by now, with its route and how far it is processed, or another file, or
   * none. The form is as old as it was: a "Save" held back, since the server could still fill in the metadata from
   * the file, would come free over a form older than what the server has filled in since, so it stays held back
   * whatever is held of the file from now on - and so does one taken with the first file of an asset that had none,
   * processed or failed by then. Not for a file the server found a duplicate: it filled in nothing. An open question
   * is not answered by it either.
   * `whole`: the form takes the whole answer in its place (`setAsset`: the form is new, a "Save" held back comes
   * free) - when nothing is typed into it and no save of it went out, as the read is asked and as it is answered. What
   * was typed would go, and a read sent before a save can be answered as the asset was before it: saved again, that
   * form would write the old values back. Otherwise only the main file is taken, as above. */
  const readQuietly = async (whole: boolean) => {
    const held = assetDetailStore.asset
    if (isNull(held)) return
    const asked = ++latestQuietRead
    // Only into the very asset it was read for: not into another one, nor into this one read anew since.
    const isTaken = () => assetDetailStore.asset === held && asked === latestQuietRead
    const savesBefore = assetDetailStore.savesOf(held.id)
    const formIsAsRead = () =>
      !assetDetailStore.metadataAreTouched && savesBefore !== null && assetDetailStore.savesOf(held.id) === savesBefore
    const takesWhole = whole && formIsAsRead()
    try {
      const res = await fetchAsset(held.id)
      if (!isTaken()) return
      if (takesWhole && formIsAsRead()) {
        assetDetailStore.setAsset(res)
        assetDetailStore.updateLastFetched(held.id)
        addToCachedUsers(res.createdBy, res.modifiedBy)
        fetchCachedUsers()
        return
      }
      assetDetailStore.setMainFile(res, formMayBeOlder(held, res))
    } catch (error) {
      if (!isTaken() || !onPage()) return
      showErrorsDefault(error)
    }
  }

  /**
   * With nothing typed the asset is read whole, the way of the page that draws the detail (`readWhole`): after a
   * change the user made in the detail. Told by the server (`byServer`), the read is quiet whatever is typed: it
   * comes at any moment, under whatever the user is doing in the detail.
   */
  const readAfterFileChange = (readWhole: () => Promise<void>, byServer = false) => {
    if (byServer) return readQuietly(true)

    return assetDetailStore.metadataAreTouched ? readQuietly(false) : readWhole()
  }

  return { readAfterFileChange }
}
