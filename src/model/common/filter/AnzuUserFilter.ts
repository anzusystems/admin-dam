import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'

const makeFilter = makeFilterHelper('common', 'anzuUser')

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  email: {
    ...makeFilter({ name: 'email', variant: 'startsWith' }),
  },
  enabled: {
    ...makeFilter({ name: 'enabled' }),
  },
})

export function useAnzuUserFilter() {
  return filter
}
