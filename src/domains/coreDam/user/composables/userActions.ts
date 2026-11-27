import { fetchDamUserListByIds, useFetchDamUserList } from '@anzusystems/common-admin'
import type { DamUser, FilterConfig, FilterData, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import type { Ref } from 'vue'

import { damClient } from '@/shared/apiClients/damClient'

export const useUserSelectActions = () => {
  const { execute } = useFetchDamUserList(damClient)

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const users = await execute(pagination, filterData, filterConfig)

    return <ValueObjectOption<number>[]>users.map((user: DamUser) => ({
      title: user.email,
      value: user.id,
    }))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    const users = await fetchDamUserListByIds(damClient, ids)

    return <ValueObjectOption<number>[]>users.map((user: DamUser) => ({
      title: user.email,
      value: user.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
