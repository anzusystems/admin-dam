import { useMediaQuery } from '@vueuse/core'
import { useId } from 'vue'

/* The info panel of an asset detail as the library lays it out (`.dam-image-detail__sidebar` in its css): from 840 px
 * wide a closed panel slides out of view, narrower the panel always shows and its toggle shows or hides the image
 * instead. So only on the wide layout is the panel open or closed: there its toggle says which, and a closed panel is
 * left out of the page for the keyboard and the screen reader too. The width is the one of the library's rule. */
export function useDetailInfoPanel() {
  return {
    wide: useMediaQuery('(width >= 840px)'),
    panelId: useId(),
  }
}
