import type { DocId } from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'

/*
 * The preview image is set by a request, and the card shows it after reading the file again.
 * By the answer, the requesting card may be gone and replaced, because detail
 * tabs re-render on switch. The new card read the file before the image was set.
 * So the answer goes to whichever card is mounted then.
 */
const cards = new Set<(fileId: DocId) => void>()

/** Call in the card's setup. `imageSet` receives the file whose preview was set, while the card is mounted. */
export const onVideoPreviewSet = (imageSet: (fileId: DocId) => void) => {
  cards.add(imageSet)
  onBeforeUnmount(() => cards.delete(imageSet))
}

/** The file's preview image was set. The card showing the file reads it again. */
export const videoPreviewSet = (fileId: DocId) => cards.forEach((imageSet) => imageSet(fileId))
