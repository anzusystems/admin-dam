import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

const filterFields = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'email' as const, default: null, type: 'string', variant: 'startsWith', render: { skip: true } },
  { name: 'enabled' as const, default: null, type: 'boolean' },
  { name: 'lastName' as const, default: null, type: 'string', variant: 'startsWith', apiName: 'person.lastName' },
  { name: 'permissionGroups' as const, default: [], type: 'string', variant: 'custom' },
] satisfies readonly MakeFilterOption[]

export function useAnzuUserFilter() {
  const { filterConfig, filterData } = createFilter(filterFields, createFilterStore(filterFields), {
    system: 'common',
    subject: 'anzuUser',
  })

  return {
    filterConfig,
    filterData,
  }
}
