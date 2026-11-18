<script lang="ts">
import { createRemoteAutocomplete } from '@anzusystems/common-admin'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'

import { useVideoShowSelectActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import { useVideoShowFilter } from '@/domains/coreDam/videoShow/filter/VideoShowFilter'

export default createRemoteAutocomplete<DocId, DocIdNullable>({
  name: 'VideoShowRemoteAutocomplete',
  useSelectActions: useVideoShowSelectActions,
  useInnerFilter: useVideoShowFilter,
  filterByField: 'title',
  prefetch: 'hover',
  defaults: { 'data-cy': '' },
})
</script>
