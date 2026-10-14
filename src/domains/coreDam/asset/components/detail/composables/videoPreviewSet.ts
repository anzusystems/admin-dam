import type { DocId } from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'

/* The preview image of a file of a video is set by a request, and the card of the preview image shows it once it reads
 * the file again. By the answer the card that asked can be gone and another drawn in its place - the tabs of the
 * detail are drawn anew as they are switched - which has read the file as it was before the image was set. So the
 * answer is told to whichever card is there then, not to the one that asked. */
const cards = new Set<(fileId: DocId) => void>()

/** For the card, in its setup: `imageSet` is called with the file whose preview image was set, while it is drawn. */
export const onVideoPreviewSet = (imageSet: (fileId: DocId) => void) => {
  cards.add(imageSet)
  onBeforeUnmount(() => cards.delete(imageSet))
}

/** The preview image of the file was set: the card that shows the file reads it again. */
export const videoPreviewSet = (fileId: DocId) => cards.forEach((imageSet) => imageSet(fileId))
