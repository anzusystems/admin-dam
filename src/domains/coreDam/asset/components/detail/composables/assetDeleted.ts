import type { DocId } from '@anzusystems/common-admin'
import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

/*
 * The page is told about a deletion through a provided function, not an event.
 * The delete answers after a request, and the deleting component may
 * be unmounted by then. Vue drops events from unmounted components.
 * A page that provides nothing is not told.
 */
const AssetDeletedKey: InjectionKey<(assetId: DocId) => void> = Symbol('assetDeleted')

/** Call in the setup of the page that draws the detail. `deleted` receives the id of the deleted asset. */
export const provideAssetDeleted = (deleted: (assetId: DocId) => void) => provide(AssetDeletedKey, deleted)

/** Call in the setup of the detail part that deletes the asset. */
export const useAssetDeleted = () => inject(AssetDeletedKey, () => undefined)
