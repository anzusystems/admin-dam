<script lang="ts">
import { createFilterRemoteAutocomplete } from '@anzusystems/common-admin'

import { useExtSystemSelectActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import { useExtSystemFilter } from '@/domains/coreDam/extSystem/filter/ExtSystemFilter'

export default createFilterRemoteAutocomplete({
  name: 'FilterExtSystemRemoteAutocomplete',
  useSelectActions: useExtSystemSelectActions,
  useInnerFilter: useExtSystemFilter,
  filterByField: 'name',
})
</script>
