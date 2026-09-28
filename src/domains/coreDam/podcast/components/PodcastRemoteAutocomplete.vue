<script lang="ts">
import { createRemoteAutocomplete } from '@anzusystems/common-admin'
import type { IntegerIdNullable } from '@anzusystems/common-admin'
import type { PropType } from 'vue'

import { usePodcastSelectActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/domains/coreDam/podcast/filter/PodcastFilter'

// Scoped to an explicitly passed ext system (the synthesize dialog), else the actions use the current one.
// Another ext system remounts the list; the dialog clears its picks itself, so the model is kept.
export default createRemoteAutocomplete({
  name: 'PodcastRemoteAutocomplete',
  props: { extSystemId: { type: Number as PropType<IntegerIdNullable>, default: undefined } },
  useSelectActions: (props) => usePodcastSelectActions(() => props.extSystemId),
  useInnerFilter: usePodcastFilter,
  scope: { of: (props) => props.extSystemId ?? undefined, reset: false },
  filterByField: 'title',
  prefetch: 'hover',
  defaults: { clearable: false, disabled: false, 'data-cy': '', minSearchText: 'coreDam.podcast.filterMinChars' },
})
</script>
