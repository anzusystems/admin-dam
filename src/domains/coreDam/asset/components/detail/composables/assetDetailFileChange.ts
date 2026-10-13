import { assetFileIsVideoFile, isNull, useAlerts, usePageNavigation } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import { fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { metadataMayStillChange } from '@/domains/coreDam/asset/store/uploadQueuesStore'

/* The page that draws a detail is told that the file of its asset has changed - the route of its main file, or which
 * of its files is the main one - by a function it provides, not by an event of the part of the detail that made the
 * change. The change is answered after a request, and by then that part can be unmounted (another tab of the detail,
 * the detail closed): what an unmounted component emits Vue drops. */
const AssetFileChangedKey: InjectionKey<() => void> = Symbol('assetFileChanged')

/** For the page that draws the detail, in its setup: `fileChanged` is what the parts of the detail tell it by. */
export const provideAssetFileChanged = (fileChanged: () => void) => provide(AssetFileChangedKey, fileChanged)

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

/* The reads below that take only what changed, counted: two changes close after each other start two of them, and
 * the answer of the older can come last. Only the one asked for last is taken. */
let latestQuietRead = 0

/* The asset a detail holds is read again once its file was changed there, in the dialog over the list, in the panel
 * beside the list and on the pages of a detail alike. */
export function useAssetDetailFileChange() {
  const assetDetailStore = useAssetDetailStore()
  const { onPage } = usePageNavigation()
  const { showErrorsDefault } = useAlerts()

  /* Metadata that were not saved stay as they are, in the form they were typed into: no loader goes over it, and of the
   * answer only what the change touched is taken. While the main file is the one the form was read with, that is its
   * route: the rest stays as the form was read, the processing status of the file with it - "Save" is held back by
   * that, and would come free over a form older than what the server has since filled in. When the main file is
   * another one, or none, it is that file, and for the same reason a "Save" held back stays so. An open question is
   * not answered by it either. */
  const takeChangedOfFile = async () => {
    const held = assetDetailStore.asset
    if (isNull(held)) return
    const asked = ++latestQuietRead
    // Only into the very asset it was read for: not into another one, nor into this one read anew since.
    const isTaken = () => assetDetailStore.asset === held && asked === latestQuietRead
    try {
      const res = await fetchAsset(held.id)
      if (!isTaken()) return
      const file = held.mainFile
      const read = res.mainFile
      if (file?.id !== read?.id) {
        assetDetailStore.setMainFile(res, metadataMayStillChange(held))

        return
      }
      if (!file || !read || assetFileIsVideoFile(file) || assetFileIsVideoFile(read)) return
      file.mainRoute = read.mainRoute
    } catch (error) {
      if (!isTaken() || !onPage()) return
      showErrorsDefault(error)
    }
  }

  /** With nothing typed the asset is read whole, the way of the page that draws the detail (`readWhole`). */
  const readAfterFileChange = (readWhole: () => Promise<void>) =>
    assetDetailStore.metadataAreTouched ? takeChangedOfFile() : readWhole()

  return { readAfterFileChange }
}
