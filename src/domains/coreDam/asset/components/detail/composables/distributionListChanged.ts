import { ref, watch } from 'vue'

/* The tab of the distributions is told that what it lists has changed apart from the part that changed it, not by an
 * event of that part: the change is answered after a request, and by then that part can be unmounted (the advanced
 * settings hidden, the dialog of a record with them) - what an unmounted component emits Vue drops. Nor by the tab the
 * part was drawn in: closed and opened again meanwhile, the tab drawn by then is another one, which may have read its
 * list before the change was answered. The changes answered, counted: whatever tab is drawn reads its list anew. */
const changes = ref(0)

/** For the tab, in its setup: `changed` reads its list anew, while the tab is there. */
export const onDistributionListChanged = (changed: () => void) => watch(changes, changed)

/** For a part of the tab that changes a distribution, once the change is answered. */
export const distributionListChanged = () => {
  changes.value++
}
