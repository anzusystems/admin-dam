import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  title: {
    ...makeFilter({ name: 'title', field: 'texts.title', variant: 'startsWith' }),
  },
})

export function usePodcastListFilter() {
  return filter
}

export function usePodcastFilter() {
  return reactive({
    title: {
      ...makeFilter({ name: 'title', field: 'texts.title', variant: 'startsWith' }),
    },
  })
}
