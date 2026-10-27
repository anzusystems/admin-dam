<script lang="ts">
import { createRemoteAutocomplete } from '@anzusystems/common-admin'
import type { PropType } from 'vue'

import { useAuthorSelectActions } from '@/domains/coreDam/author/composables/authorActions'
import { useAuthorInnerFilter } from '@/domains/coreDam/author/filter/AuthorFilter'

// `canBeCurrentAuthor` only narrows the list. Callers pass a constant, so the model is never reset.
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
