import type { DocId } from '@anzusystems/common-admin'
import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

/* The page that draws a detail is told that the asset was deleted in it by a function it provides, not by an event of
 * the part of the detail that deleted it: the delete is answered after a request, and by then that part can be
 * unmounted (another tab of the detail, the detail gone on to the next asset) - what an unmounted component emits Vue
 * drops. A page that provides nothing is told nothing. */
const AssetDeletedKey: InjectionKey<(assetId: DocId) => void> = Symbol('assetDeleted')

/** For the page that draws the detail, in its setup: `deleted` is called with the asset the detail deleted. */
export const provideAssetDeleted = (deleted: (assetId: DocId) => void) => provide(AssetDeletedKey, deleted)

/** For the part of the detail that deletes the asset, in its setup. */
export const useAssetDeleted = () => inject(AssetDeletedKey, () => undefined)
