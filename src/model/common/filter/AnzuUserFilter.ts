import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'

const makeFilter = makeFilterHelper('common', 'anzuUser')

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id', default: null }),
  },
  email: {
    ...makeFilter({ name: 'email', variant: 'startsWith' }),
  },
  enabled: {
    ...makeFilter({ name: 'enabled' }),
  },
  lastName: {
    ...makeFilter({ name: 'lastName', variant: 'startsWith', field: 'person.lastName' }),
  }
})

export function useAnzuUserFilter() {
  return filter
}
