import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastEpisodeApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  title: {
    ...makeFilter({ name: 'title', field: 'texts.title', variant: 'startsWith' }),
  },
})

export function usePodcastEpisodeFilter() {
  return filter
}
