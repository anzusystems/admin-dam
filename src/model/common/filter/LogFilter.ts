import { reactive } from 'vue'
import type { Filter } from '@anzusystems/common-admin'
import {
  dateTimeEndOfDay,
  dateTimeStartOfDay,
  makeFilterHelper,
  type MakeFilterOptions,
} from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/common/logApi'
import type { LogSystemType } from '@/model/common/valueObject/LogSystem'
import { LogTypeDefault } from '@/model/common/valueObject/LogType'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper('common', ENTITY)

const filter = reactive({
  system: {
    ...makeFilter<LogSystemType[]>({ name: 'system', variant: 'in', mandatory: true, exclude: true }),
  },
  contextAppSystem: {
    ...makeFilter<LogSystemType>({ name: 'system', mandatory: true, field: 'context.appSystem' }),
  },
  type: {
    ...makeFilter({ name: 'type', variant: 'in', default: LogTypeDefault, exclude: true }),
  },
  levelName: {
    ...makeFilter({ name: 'levelName', variant: 'in' }),
  },
  id: {
    ...makeFilter({ name: 'id' }),
  },
  contextId: {
    ...makeFilter({ name: 'contextId', field: 'context.contextId' }),
  },
  message: {
    ...makeFilter({ name: 'message', variant: 'startsWith' }),
  },
  appVersion: {
    ...makeFilter({ name: 'appVersion', variant: 'startsWith', field: 'context.appVersion' }),
  },
  userId: {
    ...makeFilter({ name: 'userId', field: 'context.userId' }),
  },
  resourceName: {
    ...makeFilter({ name: 'resourceName', field: 'context.resourceName' }),
  },
  resourceId: {
    ...makeFilter({ name: 'resourceIds', field: 'context.resourceIds', variant: 'in' }),
  },
  datetimeFrom: {
    ...makeFilter({
      name: 'datetimeFrom',
      field: 'datetime',
      variant: 'gte',
      default: dateTimeStartOfDay(-1),
      mandatory: true,
    }),
  },
  datetimeTo: {
    ...makeFilter({
      name: 'datetimeTo',
      field: 'datetime',
      variant: 'lte',
      default: dateTimeEndOfDay(),
      mandatory: true,
    }),
  },
})

export function useLogFilter() {
  return filter
}
