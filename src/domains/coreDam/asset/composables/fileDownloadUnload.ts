import { isUndefined } from '@anzusystems/common-admin'

/* The link of a file to download is followed in the tab it is pressed in. The server answers it as an attachment, so
 * the page stays - but the browser raises `beforeunload` for it as for any navigation, in the task of the click or in
 * one soon after it. A page that asks before it is unloaded takes one `beforeunload` for each press, the first that
 * comes within this time of it, for the one of the download, and lets it be: no later one, and none once the time has
 * passed. */
const TIME_TO_UNLOAD = 1000

/* When each press was made that no `beforeunload` was taken for yet, the oldest first. By a clock that does not go
 * back: the one of the wall can be set, and a press would then count for longer, or not at all. */
let pressedAt: number[] = []

const stillCounting = () => {
  const now = performance.now()

  return pressedAt.filter((pressed) => now - pressed <= TIME_TO_UNLOAD)
}

export const useFileDownloadUnload = () => {
  const downloadPressed = () => {
    pressedAt = [...stillCounting(), performance.now()]
  }

  /** Whether the `beforeunload` raised now is the one of a download just pressed. Said once for each press. */
  const unloadIsOfDownload = () => {
    const [pressed, ...later] = stillCounting()
    pressedAt = later

    return !isUndefined(pressed)
  }

  return { downloadPressed, unloadIsOfDownload }
}
