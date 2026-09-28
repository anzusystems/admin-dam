<script lang="ts">
import { createRemoteAutocomplete } from '@anzusystems/common-admin'
import type { DocId, DocIdNullable, IntegerId } from '@anzusystems/common-admin'
import type { PropType } from 'vue'

import { useVoiceFamilySelectActions } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyFilter } from '@/domains/coreDam/voiceFamily/filter/VoiceFamilyFilter'

const props = { extSystemId: { type: Number as PropType<IntegerId>, required: true } } as const

export default createRemoteAutocomplete<DocId, DocIdNullable, typeof props>({
  name: 'VoiceFamilyRemoteAutocomplete',
  props,
  useSelectActions: (props) => useVoiceFamilySelectActions(() => props.extSystemId),
  useInnerFilter: useVoiceFamilyFilter,
  filterByField: 'displayName',
  defaults: { clearable: false, 'data-cy': '', minSearchText: 'coreDam.voiceFamily.filterMinChars' },
})
</script>
