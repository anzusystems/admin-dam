import { dateTimeEndOfDay, dateTimeStartOfDay } from '@anzusystems/common-admin'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { ENTITY } from '@/domains/common/log/api/logApi'
import { LogTypeDefault } from '@/domains/common/log/valueObject/LogType'

const filterFieldsList = [
  {
    name: 'system' as const,
    variant: 'in',
    default: [],
    type: 'string',
    mandatory: true,
    exclude: true,
    render: { skip: true },
  },
  {
    name: 'contextAppSystem' as const,
    apiName: 'context.appSystem',
    default: null,
    type: 'string',
    mandatory: true,
    render: { skip: true },
  },
  {
    name: 'type' as const,
    variant: 'in',
    default: LogTypeDefault,
    type: 'string',
    exclude: true,
    render: { skip: true },
  },
  { name: 'levelName' as const, variant: 'in', default: [], type: 'string' },
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'contextId' as const, apiName: 'context.contextId', default: null, type: 'string' },
  { name: 'message' as const, variant: 'startsWith', default: null, type: 'string' },
  { name: 'appVersion' as const, apiName: 'context.appVersion', variant: 'startsWith', default: null, type: 'string' },
  { name: 'userId' as const, apiName: 'context.userId', default: null, type: 'integer' },
  { name: 'resourceName' as const, apiName: 'context.resourceName', default: null, type: 'string' },
  {
    name: 'resourceId' as const,
    apiName: 'context.resourceIds',
    titleT: 'common.log.filter.resourceIds',
    variant: 'in',
    default: [],
    type: 'string',
  },
  {
    name: 'datetimeFrom' as const,
    apiName: 'datetime',
    default: dateTimeStartOfDay(-1),
    type: 'timeInterval',
    related: 'datetimeTo',
    mandatory: true,
  },
  {
    name: 'datetimeTo' as const,
    apiName: 'datetime',
    default: dateTimeEndOfDay(),
    type: 'timeInterval',
    mandatory: true,
    exclude: true,
    render: { skip: true },
  },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function useLogFilter() {
  const { filterConfig, filterData } = createFilter(filterFieldsList, listFiltersStore, {
    system: 'common',
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
