import { reactive } from 'vue'
import { LogType } from '@/model/common/valueObject/LogType'
import { dateTimeEndOfDay, dateTimeStartOfDay } from '@anzusystems/common-admin'
import { makeFilterHelper, type MakeFilterOptions } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/common/logApi'
import type { Filter } from '@anzusystems/common-admin'
import type { LogSystem } from '@/model/common/valueObject/LogSystem'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper('common', ENTITY)

const filter = reactive({
  system: {
    ...makeFilter<LogSystem[]>({ name: 'system', variant: 'in', mandatory: true, exclude: true }),
  },
  contextAppSystem: {
    ...makeFilter<LogSystem>({ name: 'system', mandatory: true, field: 'context.appSystem' }),
  },
  type: {
    ...makeFilter({ name: 'type', variant: 'in', default: LogType.Default, exclude: true }),
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
