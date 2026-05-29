import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

const filterFields = [
  { name: 'id' as const, default: null },
  { name: 'email' as const, default: null, variant: 'startsWith' },
  { name: 'enabled' as const, default: null },
  { name: 'lastName' as const, default: null, variant: 'startsWith', apiName: 'person.lastName' },
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
