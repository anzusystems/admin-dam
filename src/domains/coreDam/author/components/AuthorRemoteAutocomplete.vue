<script lang="ts">
import { createRemoteAutocomplete } from '@anzusystems/common-admin'
import type { PropType } from 'vue'

import { useAuthorSelectActions } from '@/domains/coreDam/author/composables/authorActions'
import { useAuthorInnerFilter } from '@/domains/coreDam/author/filter/AuthorFilter'

// `canBeCurrentAuthor` only narrows the list; its callers pass it as a constant, so nothing is reset (the
// hand-written version set the model to null at mount, even for a multiple field).
export default createRemoteAutocomplete({
  name: 'AuthorRemoteAutocomplete',
  props: { canBeCurrentAuthor: { type: Boolean as PropType<boolean | null | undefined>, default: null } },
  useSelectActions: () => useAuthorSelectActions(),
  useInnerFilter: useAuthorInnerFilter,
  filterFromProps: (props) => ({ canBeCurrentAuthor: props.canBeCurrentAuthor || null }),
  filterByField: 'text',
  defaults: { disabled: false },
})
</script>
