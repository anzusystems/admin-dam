<script lang="ts">
import { createRemoteAutocomplete } from '@anzusystems/common-admin'
import type { PropType } from 'vue'

import { useAuthorSelectActions } from '@/domains/coreDam/author/composables/authorActions'
import { useAuthorInnerFilter } from '@/domains/coreDam/author/filter/AuthorFilter'

// `canBeCurrentAuthor` and `source` only narrow the list. Callers pass constants, so the model is never reset.
// `source`: `true` offers only sources, `false` only authors that are not sources, unset all.
export default createRemoteAutocomplete({
  name: 'AuthorRemoteAutocomplete',
  props: {
    canBeCurrentAuthor: { type: Boolean as PropType<boolean | null | undefined>, default: null },
    source: { type: Boolean as PropType<boolean | null | undefined>, default: null },
  },
  useSelectActions: () => useAuthorSelectActions(),
  useInnerFilter: useAuthorInnerFilter,
  filterFromProps: (props) => ({ canBeCurrentAuthor: props.canBeCurrentAuthor || null, source: props.source ?? null }),
  filterByField: 'text',
  defaults: { disabled: false },
})
</script>
