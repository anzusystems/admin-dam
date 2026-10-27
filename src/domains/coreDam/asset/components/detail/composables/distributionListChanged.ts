import { ref, watch } from 'vue'

/*
 * The distributions tab is not notified by an emitted event. The change is answered after a request,
 * and the emitting part may be unmounted by then. Vue drops events from unmounted components.
 * The tab itself may also have been closed and reopened, and the new one may have read its list before the answer.
 * So answered changes are counted, and whichever tab is rendered reloads its list.
 */
const changes = ref(0)

/**
 * Call in the tab's setup. `changed` reloads the list while the tab is mounted.
 */
export const onDistributionListChanged = (changed: () => void) => watch(changes, changed)

/**
 * Call from a part that changes a distribution, once the change is answered.
 */
export const distributionListChanged = () => {
  changes.value++
}
