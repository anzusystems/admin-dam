import { useMediaQuery } from '@vueuse/core'
import { useId } from 'vue'

/*
 * Mirrors the library's `.dam-image-detail__sidebar` CSS. From 840 px wide, a closed panel slides out of view.
 * Narrower, the panel always shows and its toggle shows or hides the image instead.
 * So open/closed exists only on the wide layout. There a closed panel is also hidden from keyboard and screen readers.
 * The width must match the library's rule.
 */
export function useDetailInfoPanel() {
  return {
    wide: useMediaQuery('(width >= 840px)'),
    panelId: useId(),
  }
}
