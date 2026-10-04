import {
  cloneDeep,
  fetchDamAssetLicenceGroupListByIds,
  fetchDamUser,
  fetchDamUserListByIds,
  handleRecordLoadError,
  updateDamUser,
  useAlerts,
  useDamCachedUsers,
  useFetchDamUserList,
  usePageNavigation,
} from '@anzusystems/common-admin'
import type { DamUser, FilterConfig, FilterData, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/domains/coreDam/extSystem/composables/cachedExtSystems'
import { useUserOneStore } from '@/domains/coreDam/user/store/userStore'
import { damClient } from '@/shared/apiClients/damClient'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { fetchCachedExtSystems, addToCachedExtSystems } = useCachedExtSystems()
const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useUserListActions = () => {
  const listItems = ref<DamUser[]>([])
  const { execute } = useFetchDamUserList(damClient)

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const useUserDetailActions = () => {
  const userOneStore = useUserOneStore()
  const { user, userAssetLicenceGroups } = storeToRefs(userOneStore)
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

  const fetchData = async (id: number, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      // The DAM user requests take no signal: a page left meanwhile ignores their answers instead.
      const user = await fetchDamUser(damClient, id)
      if (options.signal?.aborted) return undefined
      userOneStore.setUser(user)
      // The user is there by now: failing to load the licence groups shows the user without them.
      try {
        const licenceGroups = await fetchDamAssetLicenceGroupListByIds(damClient, user.licenceGroups)
        if (options.signal?.aborted) return undefined
        userAssetLicenceGroups.value = licenceGroups
      } catch (error) {
        if (options.signal?.aborted) return undefined
        showErrorsDefault(error)
      }
      addToCachedExtSystems(user.adminToExtSystems, user.userToExtSystems)
      addToCachedAssetLicences(user.assetLicences)
      addToCachedUsers(user.createdBy, user.modifiedBy)
      fetchCachedUsers()
      fetchCachedExtSystems()
      fetchCachedAssetLicences()
      return true
    } catch (error) {
      if (options.signal?.aborted) return undefined
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      // An aborted load belongs to a page that is gone; the flag is the next page's by now.
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  return {
    user,
    detailLoading,
    fetchData,
    resetStore: userOneStore.reset,
  }
}

export const useUserEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const userOneStore = useUserOneStore()
  const { userUpdate, user } = storeToRefs(userOneStore)

  const fetchData = async (id: number, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      const user = await fetchDamUser(damClient, id)
      if (options.signal?.aborted) return undefined
      userOneStore.setUser(user)
      return true
    } catch (error) {
      if (options.signal?.aborted) return undefined
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  const onUpdate = async (close = false) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      const userUpdateCloned = cloneDeep(userUpdate.value)
      await updateDamUser(damClient, userOneStore.user.id, userUpdateCloned)
      showRecordWas('updated')
      if (!close) return
      push({ name: '/(coreDam)/users' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    user,
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    userUpdate,
    fetchData,
    onUpdate,
    resetStore: userOneStore.reset,
  }
}

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
